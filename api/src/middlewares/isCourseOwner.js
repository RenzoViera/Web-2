import * as cursoRepo from '../repositories/curso.repository.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../utils/errorCodes.js';

/**
 * Middleware que verifica que el curso exista y que el usuario autenticado sea el instructor dueño (RN-07).
 * Deja `req.curso` disponible para el controlador o siguientes middlewares.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
export const isCourseOwner = async (req, _res, next) => {
  const cursoId = Number(req.params.id);
  if (!Number.isInteger(cursoId) || cursoId <= 0) {
    throw new AppError(400, ERROR_CODES.BAD_REQUEST, 'Identificador de curso inválido');
  }

  const curso = await cursoRepo.findById(cursoId);
  if (!curso) {
    throw new AppError(404, ERROR_CODES.COURSE_NOT_FOUND, 'Curso no encontrado');
  }

  if (curso.instructorId !== req.user.id) {
    throw new AppError(403, ERROR_CODES.FORBIDDEN, 'No tienes permiso para administrar este curso');
  }

  req.curso = curso;
  next();
};
