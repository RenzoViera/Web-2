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
 * Métricas detalladas y avance por lección de un curso del instructor.
 * @param {any} curso Curso validado como propio por isCourseOwner.
 */
export const obtenerCursoResumen = async (curso) => {
  const metricas = await instructorRepo.getCursoMetricas(curso.id);
  const leccionesRaw = await instructorRepo.getCursoLeccionesMetricas(curso.id);

  const lecciones = leccionesRaw.map((leccion) => ({
    ...leccion,
    tasaCompletitud:
      metricas.totalInscritos > 0
        ? Math.round((leccion.completados / metricas.totalInscritos) * 100)
        : 0,
  }));

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
