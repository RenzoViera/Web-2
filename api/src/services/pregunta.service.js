import * as preguntaRepo from '../repositories/pregunta.repository.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../utils/errorCodes.js';
import { MAX_PREGUNTAS_POR_LECCION } from '../validators/pregunta.validator.js';

/**
 * @typedef {{ enunciado: string, opciones: string[], indiceCorrecto: number, explicacion?: string | null }} PreguntaInput
 */

/**
 * Crea una pregunta de opción múltiple. Solo en lecciones de tipo cuestionario.
 * @param {{ id: number, tipo: 'contenido' | 'cuestionario' }} leccion
 * @param {PreguntaInput} data
 */
export const crearPregunta = async (leccion, data) => {
  if (leccion.tipo !== 'cuestionario') {
    throw new AppError(422, ERROR_CODES.LESSON_NOT_QUIZ, 'Solo se pueden agregar preguntas a un cuestionario');
  }

  const total = await preguntaRepo.countByLeccion(leccion.id);
  if (total >= MAX_PREGUNTAS_POR_LECCION) {
    throw new AppError(
      422,
      ERROR_CODES.QUESTION_LIMIT_REACHED,
      `Un cuestionario puede tener hasta ${MAX_PREGUNTAS_POR_LECCION} preguntas`,
    );
  }

  return preguntaRepo.create({ ...data, leccionId: leccion.id, explicacion: data.explicacion ?? null });
};

/**
 * Reemplaza la pregunta completa (PUT).
 * @param {number} preguntaId
 * @param {PreguntaInput} data
 */
export const actualizarPregunta = async (preguntaId, data) => {
  const actualizada = await preguntaRepo.update(preguntaId, { ...data, explicacion: data.explicacion ?? null });
  if (!actualizada) {
    throw new AppError(404, ERROR_CODES.QUESTION_NOT_FOUND, 'Pregunta no encontrada');
  }
  return actualizada;
};

/**
 * Borra una pregunta. En un curso publicado el cuestionario no puede quedar sin preguntas (no se podría
 * calificar, mismo criterio que al publicar).
 * @param {{ id: number, leccionId: number, leccion: { curso: { estado: string } } }} pregunta
 */
export const eliminarPregunta = async (pregunta) => {
  if (pregunta.leccion.curso.estado === 'publicado') {
    const total = await preguntaRepo.countByLeccion(pregunta.leccionId);
    if (total <= 1) {
      throw new AppError(
        422,
        ERROR_CODES.QUIZ_WITHOUT_QUESTIONS,
        'Un cuestionario de un curso publicado debe tener al menos una pregunta',
      );
    }
  }
  await preguntaRepo.deleteById(pregunta.id);
};
