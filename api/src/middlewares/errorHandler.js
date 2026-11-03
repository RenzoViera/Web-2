import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError as SequelizeValidationError } from 'sequelize';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../utils/errorCodes.js';
import { logger } from '../utils/logger.js';

const fieldDetails = (items) => items.map((item) => ({ field: item.path ?? null, message: item.message }));

/** Traduce cualquier error conocido a AppError; devuelve null si es inesperado. */
const toAppError = (err) => {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({ field: issue.path.join('.') || null, message: issue.message }));
    return new AppError(422, ERROR_CODES.VALIDATION_ERROR, 'Los datos enviados no son válidos', details);
  }

  // UniqueConstraintError hereda de ValidationError: debe evaluarse primero.
  if (err instanceof UniqueConstraintError) {
    return new AppError(409, ERROR_CODES.CONFLICT, 'El recurso ya existe', fieldDetails(err.errors ?? []));
  }

  if (err instanceof ForeignKeyConstraintError) {
    return new AppError(409, ERROR_CODES.CONFLICT, 'El recurso está relacionado con otros datos');
  }

  if (err instanceof SequelizeValidationError) {
    return new AppError(422, ERROR_CODES.VALIDATION_ERROR, 'Los datos enviados no son válidos', fieldDetails(err.errors ?? []));
  }

  // Errores de body-parser (express.json).
  if (err?.type === 'entity.parse.failed') {
    return new AppError(400, ERROR_CODES.INVALID_JSON, 'El cuerpo de la solicitud no es un JSON válido');
  }
  if (err?.type === 'entity.too.large') {
    return new AppError(413, ERROR_CODES.PAYLOAD_TOO_LARGE, 'El cuerpo de la solicitud es demasiado grande');
  }

  return null;
};

// Express identifica los manejadores de error por su aridad (4 parámetros).
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const appError = toAppError(err);

  if (!appError) {
    logger.error(`[${req.id}] ${req.method} ${req.originalUrl} — error no controlado`, err);
    return res.status(500).json({
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Error interno del servidor', details: null },
    });
  }

  return res.status(appError.status).json({
    error: { code: appError.code, message: appError.message, details: appError.details ?? null },
  });
};
