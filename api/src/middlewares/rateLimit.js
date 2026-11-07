import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../utils/errorCodes.js';

const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX_FAILED_ATTEMPTS = 5;

/** Segundos que faltan para que se libere el límite (mínimo 1). */
const secondsUntil = (resetTime) =>
  resetTime ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000)) : LOGIN_WINDOW_MS / 1000;

/**
 * Login: máximo 5 intentos fallidos por minuto e IP (los exitosos no cuentan).
 * El siguiente responde 429 TOO_MANY_REQUESTS con el formato único de error y el header `Retry-After`.
 */
export const loginRateLimit = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: LOGIN_MAX_FAILED_ATTEMPTS,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, _res, next) => {
    const seconds = secondsUntil(req.rateLimit?.resetTime);
    next(
      new AppError(
        429,
        ERROR_CODES.TOO_MANY_REQUESTS,
        `Demasiados intentos de inicio de sesión. Intenta de nuevo en ${seconds} segundos.`,
      ),
    );
  },
});
