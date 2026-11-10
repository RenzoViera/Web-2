import { sequelize } from '../config/database.js';
import * as cursoRepo from '../repositories/curso.repository.js';
import * as leccionRepo from '../repositories/leccion.repository.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../utils/errorCodes.js';
import { MAX_LECCIONES_POR_CURSO } from '../validators/leccion.validator.js';

/**
 * 422 con el error debajo del campo (mismo formato que `validate`).
 * @param {string} field
 * @param {string} message
 */
const fieldError = (field, message) =>
  new AppError(422, ERROR_CODES.VALIDATION_ERROR, 'Los datos enviados no son válidos', [
    { location: 'body', field, message },
  ]);

/**
 * Crea una lección al final del temario (`orden` = último + 1). El bloqueo del curso evita que dos
 * creaciones simultáneas tomen el mismo `orden`.
 * @param {number} cursoId
 * @param {{ tipo: 'contenido' | 'cuestionario', titulo: string, contenido?: string | null, videoUrl?: string | null, notaMinima?: number }} data
 */
export const crearLeccion = (cursoId, data) =>
  sequelize.transaction(async (transaction) => {
    await cursoRepo.lockById(cursoId, transaction);
    const { total, maxOrden } = await leccionRepo.getStatsByCurso(cursoId, { transaction });
    if (total >= MAX_LECCIONES_POR_CURSO) {
      throw new AppError(
        422,
        ERROR_CODES.LESSON_LIMIT_REACHED,
        `Un curso puede tener hasta ${MAX_LECCIONES_POR_CURSO} lecciones`,
      );
    }

    const esCuestionario = data.tipo === 'cuestionario';
    return leccionRepo.create(
      {
        cursoId,
        tipo: data.tipo,
        titulo: data.titulo,
        contenido: data.contenido ?? null,
        videoUrl: esCuestionario ? null : (data.videoUrl ?? null),
        notaMinima: esCuestionario ? (data.notaMinima ?? null) : null,
        orden: maxOrden + 1,
      },
      { transaction },
    );
  });

/**
 * Edita una lección. El tipo no cambia; `videoUrl` solo aplica a contenido y `notaMinima` a cuestionarios.
 * @param {{ id: number, tipo: 'contenido' | 'cuestionario' }} leccion
 * @param {{ titulo?: string, contenido?: string | null, videoUrl?: string | null, notaMinima?: number }} changes
 */
export const actualizarLeccion = async (leccion, changes) => {
  if (leccion.tipo === 'cuestionario' && changes.videoUrl) {
    throw fieldError('videoUrl', 'Los cuestionarios no llevan video');
  }
  if (leccion.tipo === 'contenido' && changes.notaMinima !== undefined) {
    throw fieldError('notaMinima', 'Solo los cuestionarios tienen nota mínima');
  }

  const actualizada = await leccionRepo.update(leccion.id, changes);
  if (!actualizada) {
    throw new AppError(404, ERROR_CODES.LESSON_NOT_FOUND, 'Lección no encontrada');
  }
  return actualizada;
};

/**
 * Borra una lección y recompacta el `orden` (1..n).
 * - 409 si el curso tiene inscritos: borrarla alteraría su progreso (§6 del plan).
 * - 422 si es la última lección de un curso publicado (RN-05: publicado implica ≥ 1 lección).
 * @param {{ id: number, cursoId: number, curso: { estado: string } }} leccion
 */
export const eliminarLeccion = (leccion) =>
  sequelize.transaction(async (transaction) => {
    await cursoRepo.lockById(leccion.cursoId, transaction);

    const inscritos = await cursoRepo.countInscripciones(leccion.cursoId, { transaction });
    if (inscritos > 0) {
      throw new AppError(
        409,
        ERROR_CODES.COURSE_HAS_STUDENTS,
        'No se puede eliminar una lección de un curso con estudiantes inscritos',
      );
    }

    if (leccion.curso.estado === 'publicado') {
      const { total } = await leccionRepo.getStatsByCurso(leccion.cursoId, { transaction });
      if (total <= 1) {
        throw new AppError(
          422,
          ERROR_CODES.PUBLISHED_COURSE_NEEDS_LESSON,
          'Un curso publicado debe tener al menos una lección. Pásalo a borrador para eliminarla.',
        );
      }
    }

    await leccionRepo.deleteById(leccion.id, { transaction });
    await leccionRepo.compactOrden(leccion.cursoId, { transaction });
  });

/**
 * Reordena el temario en una transacción. `ids` debe contener exactamente todas las lecciones del curso.
 * @param {number} cursoId
 * @param {number[]} ids
 * @returns {Promise<object[]>} Lecciones del curso en el orden nuevo.
 */
export const reordenarLecciones = (cursoId, ids) =>
  sequelize.transaction(async (transaction) => {
    await cursoRepo.lockById(cursoId, transaction);

    const actuales = new Set(await leccionRepo.findIdsByCurso(cursoId, { transaction }));
    const coincide = ids.length === actuales.size && ids.every((id) => actuales.has(id));
    if (!coincide) {
      throw new AppError(
        422,
        ERROR_CODES.LESSON_ORDER_MISMATCH,
        'La lista debe incluir exactamente todas las lecciones del curso. Recarga la página e inténtalo de nuevo.',
      );
    }

    await leccionRepo.reorder(cursoId, ids, { transaction });
    return leccionRepo.findByCurso(cursoId, { transaction });
  });
