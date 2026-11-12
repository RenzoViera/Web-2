import * as cursoRepo from '../repositories/curso.repository.js';
import * as inscripcionRepo from '../repositories/inscripcion.repository.js';
import * as leccionRepo from '../repositories/leccion.repository.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../utils/errorCodes.js';

/**
 * Única verificación de inscripción (RN-08): exige que el estudiante esté inscrito en el curso padre.
 * @param {number} usuarioId
 * @param {number} cursoId
 * @returns {Promise<import('../models/Inscripcion.js').Inscripcion>}
 */
const assertEnrolled = async (usuarioId, cursoId) => {
  const inscripcion = await inscripcionRepo.findByUsuarioAndCurso(usuarioId, cursoId);
  if (!inscripcion) {
    throw new AppError(403, ERROR_CODES.NOT_ENROLLED, 'No estás inscrito en este curso');
  }
  return inscripcion;
};

/**
 * Curso `:id` en el que está inscrito el estudiante autenticado. Deja `req.curso` y `req.inscripcion`.
 * Va después de `validate({ params: idParamSchema })`.
 * @type {import('express').RequestHandler}
 */
export const isCourseEnrolled = async (req, _res, next) => {
  const curso = await cursoRepo.findEstadoById(Number(req.params.id));
  if (!curso) {
    throw new AppError(404, ERROR_CODES.COURSE_NOT_FOUND, 'Curso no encontrado');
  }
  const inscripcion = await assertEnrolled(req.user.id, curso.id);
  req.curso = curso;
  req.inscripcion = inscripcion;
  next();
};

/**
 * Lección `:id` de un curso en el que está inscrito el estudiante autenticado.
 * Deja `req.leccion`, `req.curso` y `req.inscripcion`.
 * @type {import('express').RequestHandler}
 */
export const isLeccionEnrolled = async (req, _res, next) => {
  const leccion = await leccionRepo.findByIdForStudent(Number(req.params.id));
  if (!leccion) {
    throw new AppError(404, ERROR_CODES.LESSON_NOT_FOUND, 'Lección no encontrada');
  }
  const inscripcion = await assertEnrolled(req.user.id, leccion.cursoId);
  req.leccion = leccion;
  req.curso = leccion.curso;
  req.inscripcion = inscripcion;
  next();
};
