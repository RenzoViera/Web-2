import * as cursoRepo from '../repositories/curso.repository.js';
import * as leccionRepo from '../repositories/leccion.repository.js';
import * as preguntaRepo from '../repositories/pregunta.repository.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../utils/errorCodes.js';

/**
 * Única verificación de propiedad (RN-07): todos los middlewares de este archivo resuelven el curso padre
 * y delegan aquí.
 * @param {{ instructorId: number } | null | undefined} curso
 * @param {number} userId
 */
const assertOwner = (curso, userId) => {
  if (!curso) {
    throw new AppError(404, ERROR_CODES.COURSE_NOT_FOUND, 'Curso no encontrado');
  }
  if (curso.instructorId !== userId) {
    throw new AppError(403, ERROR_CODES.FORBIDDEN, 'No tienes permiso para administrar este curso');
  }
};

/**
 * Curso `:id` del instructor autenticado. Deja `req.curso`.
 * Va después de `validate({ params: idParamSchema })`.
 * @type {import('express').RequestHandler}
 */
export const isCourseOwner = async (req, _res, next) => {
  const curso = await cursoRepo.findById(Number(req.params.id));
  assertOwner(curso, req.user.id);
  req.curso = curso;
  next();
};

/**
 * Lección `:id` de un curso del instructor autenticado. Deja `req.leccion` y `req.curso` (una sola consulta).
 * @type {import('express').RequestHandler}
 */
export const isLeccionOwner = async (req, _res, next) => {
  const leccion = await leccionRepo.findByIdWithCurso(Number(req.params.id));
  if (!leccion) {
    throw new AppError(404, ERROR_CODES.LESSON_NOT_FOUND, 'Lección no encontrada');
  }
  assertOwner(leccion.curso, req.user.id);
  req.leccion = leccion;
  req.curso = leccion.curso;
  next();
};

/**
 * Pregunta `:id` de un curso del instructor autenticado. Deja `req.pregunta` (una sola consulta).
 * @type {import('express').RequestHandler}
 */
export const isPreguntaOwner = async (req, _res, next) => {
  const pregunta = await preguntaRepo.findByIdWithCurso(Number(req.params.id));
  if (!pregunta) {
    throw new AppError(404, ERROR_CODES.QUESTION_NOT_FOUND, 'Pregunta no encontrada');
  }
  assertOwner(pregunta.leccion?.curso, req.user.id);
  req.pregunta = pregunta;
  next();
};
