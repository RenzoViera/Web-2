import { Op } from 'sequelize';
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
  const cursosPorEstado = await Curso.findAll({
    where: { instructorId },
    attributes: ['estado', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['estado'],
    raw: true,
  });

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

  const totalLecciones = await Leccion.count({
    include: [
      {
        model: Curso,
        as: 'curso',
        where: { instructorId },
        attributes: [],
      },
    ],
  });

  const totalInscritos = await Inscripcion.count({
    include: [
      {
        model: Curso,
        as: 'curso',
        where: { instructorId },
        attributes: [],
      },
    ],
  });

  const totalCompletados = await Inscripcion.count({
    where: { completado: true },
    include: [
      {
        model: Curso,
        as: 'curso',
        where: { instructorId },
        attributes: [],
      },
    ],
  });

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
 * Métricas generales de un curso específico.
 * @param {number} cursoId
 */
export const getCursoMetricas = async (cursoId) => {
  const totalLecciones = await Leccion.count({ where: { cursoId } });
  const totalInscritos = await Inscripcion.count({ where: { cursoId } });
  const totalCompletados = await Inscripcion.count({ where: { cursoId, completado: true } });

  const totalProgresos = await ProgresoLeccion.count({
    where: { completada: true },
    include: [
      {
        model: Leccion,
        as: 'leccion',
        where: { cursoId },
        attributes: [],
      },
    ],
  });

  const tasaCompletitud = totalInscritos > 0 ? Math.round((totalCompletados / totalInscritos) * 100) : 0;
  const promedioProgreso =
    totalInscritos > 0 && totalLecciones > 0
      ? Math.round((totalProgresos / (totalInscritos * totalLecciones)) * 100)
      : 0;

  return {
    totalInscritos,
    totalCompletados,
    tasaCompletitud,
    promedioProgreso,
    totalLecciones,
  };
};

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
