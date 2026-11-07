import * as cursoRepo from '../repositories/curso.repository.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../utils/errorCodes.js';
import { buildPaginatedResponse, getPagination } from '../utils/pagination.js';

/**
 * Crea un curso en estado 'borrador'.
 * @param {number} instructorId
 * @param {{ titulo: string, descripcion?: string | null, categoria: string, nivel: string, imagenUrl?: string | null }} data
 * @returns {Promise<object>}
 */
export const crearCurso = async (instructorId, data) => {
  return cursoRepo.create({
    ...data,
    instructorId,
    estado: 'borrador',
    imagenUrl: data.imagenUrl || null,
    descripcion: data.descripcion || null,
  });
};

/**
 * Actualiza los datos de un curso.
 * @param {number} cursoId
 * @param {object} changes
 * @returns {Promise<object>}
 */
export const actualizarCurso = async (cursoId, changes) => {
  const payload = { ...changes };
  if ('imagenUrl' in payload && !payload.imagenUrl) {
    payload.imagenUrl = null;
  }
  if ('descripcion' in payload && !payload.descripcion) {
    payload.descripcion = null;
  }
  const actualizado = await cursoRepo.update(cursoId, payload);
  if (!actualizado) {
    throw new AppError(404, ERROR_CODES.COURSE_NOT_FOUND, 'Curso no encontrado');
  }
  return actualizado;
};

/**
 * Cambia el estado de un curso con validaciones de negocio (RN-05).
 * @param {number} cursoId
 * @param {'borrador' | 'publicado' | 'archivado'} nuevoEstado
 * @returns {Promise<object>}
 */
export const cambiarEstado = async (cursoId, nuevoEstado) => {
  if (nuevoEstado === 'publicado') {
    const totalLecciones = await cursoRepo.countLecciones(cursoId);
    if (totalLecciones === 0) {
      throw new AppError(
        422,
        ERROR_CODES.COURSE_CANNOT_PUBLISH_EMPTY,
        'No se puede publicar un curso sin lecciones',
      );
    }
  }

  const actualizado = await cursoRepo.updateEstado(cursoId, nuevoEstado);
  if (!actualizado) {
    throw new AppError(404, ERROR_CODES.COURSE_NOT_FOUND, 'Curso no encontrado');
  }
  return actualizado;
};

/**
 * Elimina un curso si no tiene inscritos (RN-06).
 * @param {number} cursoId
 * @returns {Promise<void>}
 */
export const eliminarCurso = async (cursoId) => {
  const inscritos = await cursoRepo.countInscripciones(cursoId);
  if (inscritos > 0) {
    throw new AppError(
      409,
      ERROR_CODES.COURSE_HAS_STUDENTS,
      'No se puede eliminar un curso que tiene estudiantes inscritos',
    );
  }

  await cursoRepo.deleteById(cursoId);
};

/**
 * Lista los cursos de un instructor con conteo de lecciones e inscritos.
 * @param {number} instructorId
 * @param {{ page?: unknown, limit?: unknown }} query
 * @returns {Promise<{ data: object[], meta: object }>}
 */
export const obtenerCursosInstructor = async (instructorId, query) => {
  const pagination = getPagination(query);
  const { rows, count } = await cursoRepo.findInstructorCursos(instructorId, pagination);
  return buildPaginatedResponse(rows, count, pagination);
};

/**
 * Detalle completo del curso para el instructor (incluye lecciones y preguntas con respuestas para edición).
 * @param {number} cursoId
 * @returns {Promise<object>}
 */
export const obtenerCursoInstructorDetalle = async (cursoId) => {
  const curso = await cursoRepo.findInstructorCursoById(cursoId);
  if (!curso) {
    throw new AppError(404, ERROR_CODES.COURSE_NOT_FOUND, 'Curso no encontrado');
  }
  return curso;
};

/**
 * Catálogo público de cursos publicados.
 * @param {{ q?: string, categoria?: string, nivel?: string, page?: unknown, limit?: unknown }} query
 * @returns {Promise<{ data: object[], meta: object }>}
 */
export const obtenerCatalogo = async (query) => {
  const pagination = getPagination(query);
  const { rows, count } = await cursoRepo.findPublicados(query, pagination);
  return buildPaginatedResponse(rows, count, pagination);
};

/**
 * Detalle público de un curso publicado.
 * @param {number} cursoId
 * @returns {Promise<object>}
 */
export const obtenerDetallePublico = async (cursoId) => {
  const curso = await cursoRepo.findPublicadoById(cursoId);
  if (!curso) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'El curso no existe o no está publicado');
  }
  return curso;
};
