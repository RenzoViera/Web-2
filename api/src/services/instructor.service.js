import * as instructorRepo from '../repositories/instructor.repository.js';
import * as leccionRepo from '../repositories/leccion.repository.js';
import { buildPaginatedResponse, getPagination } from '../utils/pagination.js';
import { calcularPorcentaje } from './progreso.service.js';

/**
 * Resumen general del panel del instructor (métricas acumuladas de todos sus cursos).
 * @param {number} instructorId
 */
export const obtenerResumenGlobal = async (instructorId) => {
  return instructorRepo.getResumenGlobal(instructorId);
};

/**
 * @param {number} parte
 * @param {number} total
 */
const porcentaje = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0);

/**
 * Métricas detalladas y avance por lección de un curso del instructor.
 * Por lección: `llegaron` (la tienen desbloqueada: completaron todas las anteriores) y `detenidos` (es su primera
 * lección sin completar). `llegaron` se deriva en memoria de `detenidos` (REGLAS B.24): a la lección N llegan todos los
 * inscritos menos los detenidos en las lecciones anteriores. `mayorCaida` es la lección con más detenidos.
 * @param {any} curso Curso validado como propio por isCourseOwner.
 */
export const obtenerCursoResumen = async (curso) => {
  const [conteos, leccionesRaw, detenidosRows] = await Promise.all([
    instructorRepo.getCursoConteos(curso.id),
    instructorRepo.getCursoLeccionesMetricas(curso.id),
    instructorRepo.getDetenidosPorLeccion(curso.id),
  ]);
  const { totalInscritos, totalCompletados, totalProgresos, notaPromedio } = conteos;
  const totalLecciones = leccionesRaw.length;
  const detenidosMap = new Map(detenidosRows.map((row) => [row.leccionId, row.detenidos]));

  let detenidosAntes = 0;
  const lecciones = leccionesRaw.map((leccion) => {
    const detenidos = detenidosMap.get(leccion.id) ?? 0;
    const llegaron = totalInscritos - detenidosAntes;
    detenidosAntes += detenidos;
    return {
      ...leccion,
      tasaCompletitud: porcentaje(leccion.completados, totalInscritos),
      llegaron,
      detenidos,
    };
  });

  const caida = lecciones.reduce(
    (max, leccion) => (leccion.detenidos > (max?.detenidos ?? 0) ? leccion : max),
    /** @type {(typeof lecciones)[number] | null} */ (null),
  );

  const metricas = {
    totalInscritos,
    totalCompletados,
    tasaCompletitud: porcentaje(totalCompletados, totalInscritos),
    promedioProgreso: porcentaje(totalProgresos, totalInscritos * totalLecciones),
    notaPromedio,
    totalLecciones,
  };

  return {
    curso: {
      id: curso.id,
      titulo: curso.titulo,
      descripcion: curso.descripcion,
      estado: curso.estado,
      categoria: curso.categoria,
      nivel: curso.nivel,
      imagenUrl: curso.imagenUrl,
      createdAt: curso.createdAt,
      updatedAt: curso.updatedAt,
    },
    metricas,
    lecciones,
    mayorCaida: caida
      ? { leccionId: caida.id, titulo: caida.titulo, orden: caida.orden, estudiantes: caida.detenidos }
      : null,
  };
};

/**
 * Listado paginado de estudiantes inscritos en un curso con su avance y estado.
 * @param {number} cursoId
 * @param {{ page?: number, limit?: number, q?: string, completado?: boolean }} query
 */
export const obtenerCursoEstudiantes = async (cursoId, query) => {
  const pagination = getPagination(query);
  const stats = await leccionRepo.getStatsByCurso(cursoId);
  const totalLecciones = stats?.total ?? 0;

  const { rows, count } = await instructorRepo.findCursoEstudiantes(cursoId, {
    limit: pagination.limit,
    offset: pagination.offset,
    q: query.q,
    completado: query.completado,
  });

  const data = rows.map((row) => {
    const leccionesCompletadas = Number(row.get('leccionesCompletadas')) || 0;
    const porcentaje = calcularPorcentaje(leccionesCompletadas, totalLecciones);

    return {
      inscripcionId: row.id,
      estudiante: {
        id: row.estudiante.id,
        nombre: row.estudiante.nombre,
        email: row.estudiante.email,
      },
      fechaInscripcion: row.createdAt,
      completado: row.completado,
      leccionesCompletadas,
      totalLecciones,
      porcentaje,
    };
  });

  return buildPaginatedResponse(data, count, pagination);
};
