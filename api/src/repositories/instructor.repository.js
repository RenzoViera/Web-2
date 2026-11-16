import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Curso, Inscripcion, IntentoCuestionario, Leccion, ProgresoLeccion, Usuario } from '../models/index.js';

const LECCIONES_COMPLETADAS_SUBQUERY = [
  sequelize.literal(`(SELECT COUNT(*)::int
       FROM progresos_lecciones p
       JOIN lecciones l ON l.id = p."leccionId"
      WHERE p."usuarioId" = "Inscripcion"."usuarioId"
        AND l."cursoId" = "Inscripcion"."cursoId"
        AND p.completada = true)`),
  'leccionesCompletadas',
];

/**
 * Resumen métrico global de todos los cursos de un instructor.
 * @param {number} instructorId
 */
export const getResumenGlobal = async (instructorId) => {
  const delInstructor = [{ model: Curso, as: 'curso', where: { instructorId }, attributes: [] }];

  // Consultas independientes y fuera de transacción: en paralelo (REGLAS B.27).
  const [cursosPorEstado, totalLecciones, totalInscritos, totalCompletados] = await Promise.all([
    Curso.findAll({
      where: { instructorId },
      attributes: ['estado', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['estado'],
      raw: true,
    }),
    Leccion.count({ include: delInstructor }),
    Inscripcion.count({ include: delInstructor }),
    Inscripcion.count({ where: { completado: true }, include: delInstructor }),
  ]);

  const estadoCounts = {
    publicado: 0,
    borrador: 0,
    archivado: 0,
  };
  let totalCursos = 0;
  for (const row of cursosPorEstado) {
    const count = Number(row.count) || 0;
    totalCursos += count;
    if (row.estado in estadoCounts) {
      estadoCounts[row.estado] = count;
    }
  }

  const tasaCompletitud = totalInscritos > 0 ? Math.round((totalCompletados / totalInscritos) * 100) : 0;

  return {
    cursos: {
      total: totalCursos,
      publicados: estadoCounts.publicado,
      borradores: estadoCounts.borrador,
      archivados: estadoCounts.archivado,
    },
    totalLecciones,
    totalInscritos,
    totalCompletados,
    tasaCompletitud,
  };
};

/**
 * Conteos generales de un curso: inscritos, completados, lecciones completadas en total y nota promedio (promedio de
 * la mejor nota de cada estudiante en cada cuestionario que rindió; `null` si nadie rindió). Consultas independientes,
 * en paralelo (REGLAS B.27).
 * @param {number} cursoId
 * @returns {Promise<{ totalInscritos: number, totalCompletados: number, totalProgresos: number, notaPromedio: number | null }>}
 */
export const getCursoConteos = async (cursoId) => {
  const [totalInscritos, totalCompletados, totalProgresos, [nota]] = await Promise.all([
    Inscripcion.count({ where: { cursoId } }),
    Inscripcion.count({ where: { cursoId, completado: true } }),
    ProgresoLeccion.count({
      where: { completada: true },
      include: [{ model: Leccion, as: 'leccion', where: { cursoId }, attributes: [] }],
    }),
    sequelize.query(
      `SELECT ROUND(AVG(mejor.nota))::int AS "notaPromedio"
         FROM (
               SELECT MAX(ic.puntaje) AS nota
                 FROM intentos_cuestionarios ic
                 JOIN lecciones l ON l.id = ic."leccionId"
                WHERE l."cursoId" = :cursoId
                GROUP BY ic."usuarioId", ic."leccionId"
              ) mejor`,
      { replacements: { cursoId }, type: QueryTypes.SELECT },
    ),
  ]);
  const { notaPromedio } = /** @type {{ notaPromedio: number | null }} */ (nota);
  return { totalInscritos, totalCompletados, totalProgresos, notaPromedio };
};

/**
 * Por lección, cuántos estudiantes inscritos (sin el curso terminado) la tienen como **primera lección no completada**:
 * es donde están detenidos. Los que completaron todas no aparecen. Una sola consulta agregada (REGLAS B.25).
 * @param {number} cursoId
 * @returns {Promise<Array<{ leccionId: number, detenidos: number }>>}
 */
export const getDetenidosPorLeccion = (cursoId) =>
  sequelize.query(
    `SELECT pendiente.id AS "leccionId", COUNT(*)::int AS "detenidos"
       FROM inscripciones i
       JOIN LATERAL (
              SELECT l.id
                FROM lecciones l
               WHERE l."cursoId" = i."cursoId"
                 AND NOT EXISTS (
                       SELECT 1
                         FROM progresos_lecciones p
                        WHERE p."leccionId" = l.id
                          AND p."usuarioId" = i."usuarioId"
                          AND p.completada = true
                     )
               ORDER BY l.orden
               LIMIT 1
            ) pendiente ON true
      WHERE i."cursoId" = :cursoId
      GROUP BY pendiente.id`,
    { replacements: { cursoId }, type: QueryTypes.SELECT },
  );

/**
 * Métricas de avance y cuestionarios por cada lección de un curso.
 * @param {number} cursoId
 */
export const getCursoLeccionesMetricas = async (cursoId) => {
  const lecciones = await Leccion.findAll({
    where: { cursoId },
    attributes: ['id', 'titulo', 'tipo', 'orden', 'notaMinima'],
    order: [['orden', 'ASC']],
    raw: true,
  });

  if (lecciones.length === 0) {
    return [];
  }

  const leccionIds = lecciones.map((l) => l.id);

  // Conteo de estudiantes que completaron cada lección
  const completadosPorLeccion = await ProgresoLeccion.findAll({
    where: {
      leccionId: { [Op.in]: leccionIds },
      completada: true,
    },
    attributes: ['leccionId', [sequelize.fn('COUNT', sequelize.col('usuarioId')), 'completados']],
    group: ['leccionId'],
    raw: true,
  });

  const completadosMap = new Map(
    completadosPorLeccion.map((row) => [row.leccionId, Number(row.completados) || 0]),
  );

  // Estadísticas de cuestionarios (intentos, promedio de nota, aprobados)
  const quizLeccionIds = lecciones.filter((l) => l.tipo === 'cuestionario').map((l) => l.id);

  /** @type {Map<number, { totalIntentos: number, promedioPuntaje: number, totalEstudiantes: number, aprobados: number }>} */
  let quizStatsMap = new Map();

  if (quizLeccionIds.length > 0) {
    const quizStats = await IntentoCuestionario.findAll({
      where: {
        leccionId: { [Op.in]: quizLeccionIds },
      },
      attributes: [
        'leccionId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalIntentos'],
        [sequelize.fn('ROUND', sequelize.fn('AVG', sequelize.col('puntaje'))), 'promedioPuntaje'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('usuarioId'))), 'totalEstudiantes'],
        [
          sequelize.literal('COUNT(DISTINCT CASE WHEN aprobado = true THEN "usuarioId" END)::int'),
          'aprobados',
        ],
      ],
      group: ['leccionId'],
      raw: true,
    });

    quizStatsMap = new Map(
      quizStats.map((row) => [
        row.leccionId,
        {
          totalIntentos: Number(row.totalIntentos) || 0,
          promedioPuntaje: Number(row.promedioPuntaje) || 0,
          totalEstudiantes: Number(row.totalEstudiantes) || 0,
          aprobados: Number(row.aprobados) || 0,
        },
      ]),
    );
  }

  return lecciones.map((leccion) => {
    const completados = completadosMap.get(leccion.id) ?? 0;
    const rawQuiz = quizStatsMap.get(leccion.id);
    const quizStats =
      leccion.tipo === 'cuestionario'
        ? {
            totalIntentos: rawQuiz?.totalIntentos ?? 0,
            promedioPuntaje: rawQuiz?.promedioPuntaje ?? 0,
            totalEstudiantes: rawQuiz?.totalEstudiantes ?? 0,
            aprobados: rawQuiz?.aprobados ?? 0,
            tasaAprobacion:
              rawQuiz && rawQuiz.totalEstudiantes > 0
                ? Math.round((rawQuiz.aprobados / rawQuiz.totalEstudiantes) * 100)
                : 0,
          }
        : null;

    return {
      id: leccion.id,
      titulo: leccion.titulo,
      tipo: leccion.tipo,
      orden: leccion.orden,
      notaMinima: leccion.notaMinima,
      completados,
      quizStats,
    };
  });
};

/**
 * Listado paginado de estudiantes inscritos en un curso, con su avance.
 * @param {number} cursoId
 * @param {{ limit: number, offset: number, q?: string, completado?: boolean }} options
 */
export const findCursoEstudiantes = async (cursoId, { limit, offset, q, completado }) => {
  /** @type {Record<string, unknown>} */
  const where = { cursoId };
  if (typeof completado === 'boolean') {
    where.completado = completado;
  }

  /** @type {Record<string, unknown>} */
  const userWhere = {};
  if (q) {
    const escaped = q.replace(/[%_\\]/g, '\\$&');
    userWhere[Op.or] = [
      { nombre: { [Op.iLike]: `%${escaped}%` } },
      { email: { [Op.iLike]: `%${escaped}%` } },
    ];
  }

  const { rows, count } = await Inscripcion.findAndCountAll({
    where,
    attributes: ['id', 'usuarioId', 'cursoId', 'completado', 'createdAt', LECCIONES_COMPLETADAS_SUBQUERY],
    include: [
      {
        model: Usuario,
        as: 'estudiante',
        attributes: ['id', 'nombre', 'email'],
        where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { rows, count };
};
