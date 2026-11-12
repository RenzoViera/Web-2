import * as cursoRepo from '../repositories/curso.repository.js';
import * as inscripcionRepo from '../repositories/inscripcion.repository.js';
import { AppError } from '../utils/AppError.js';
import { isUniqueViolation } from '../utils/dbErrors.js';
import { ERROR_CODES } from '../utils/errorCodes.js';
import { buildPaginatedResponse, getPagination } from '../utils/pagination.js';
import { calcularPorcentaje } from './progreso.service.js';

/**
 * @typedef {object} MiInscripcion
 * @property {number} id
 * @property {number} cursoId
 * @property {boolean} completado
 * @property {Date} fechaInscripcion
 * @property {{ id: number, titulo: string, categoria: string, nivel: string, estado: string, imagenUrl: string | null, instructor: { id: number, nombre: string } }} curso
 * @property {number} totalLecciones
 * @property {number} leccionesCompletadas
 * @property {number} porcentaje 0-100 (`calcularPorcentaje`).
 * @property {number | null} siguienteLeccionId Primera lección sin completar (o la primera si completó todas).
 */

/**
 * Inscribe a un estudiante en un curso publicado.
 * - 404 si el curso no existe o no está publicado (RN-05: borradores y archivados no aceptan inscripciones).
 * - 409 `ALREADY_ENROLLED` si ya estaba inscrito (RN-04): lo detecta el índice UNIQUE, sin consulta previa.
 * @param {number} usuarioId
 * @param {number} cursoId
 */
export const inscribir = async (usuarioId, cursoId) => {
  const curso = await cursoRepo.findEstadoById(cursoId);
  if (curso?.estado !== 'publicado') {
    throw new AppError(404, ERROR_CODES.COURSE_NOT_FOUND, 'El curso no existe o no está publicado');
  }

  try {
    return await inscripcionRepo.create({ usuarioId, cursoId });
  } catch (error) {
    // Sin filtrar por columna: el único UNIQUE de la tabla es (usuarioId, cursoId).
    if (isUniqueViolation(error)) {
      throw new AppError(409, ERROR_CODES.ALREADY_ENROLLED, 'Ya estás inscrito en este curso');
    }
    throw error;
  }
};

/**
 * @param {import('../models/Inscripcion.js').Inscripcion} row
 * @returns {MiInscripcion}
 */
const toMiInscripcion = (row) => {
  const { id, cursoId, completado, createdAt, curso, totalLecciones, leccionesCompletadas, siguienteLeccionId } = row.get({
    plain: true,
  });
  return {
    id,
    cursoId,
    completado: Boolean(completado),
    fechaInscripcion: createdAt,
    curso,
    totalLecciones,
    leccionesCompletadas,
    porcentaje: calcularPorcentaje(leccionesCompletadas, totalLecciones),
    siguienteLeccionId,
  };
};

/**
 * Inscripciones del estudiante autenticado (RN-08: solo las propias, el id sale del JWT), paginadas.
 * Incluye cursos archivados: el estudiante inscrito conserva el acceso (§6 del plan).
 * @param {number} usuarioId
 * @param {{ page?: unknown, limit?: unknown }} query
 * @returns {Promise<{ data: MiInscripcion[], meta: object }>}
 */
export const obtenerMisInscripciones = async (usuarioId, query) => {
  const pagination = getPagination(query);
  const { rows, count } = await inscripcionRepo.findByUsuario(usuarioId, pagination);
  return buildPaginatedResponse(rows.map(toMiInscripcion), count, pagination);
};
