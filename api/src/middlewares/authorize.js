import { authRequired } from '../services/auth.service.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../utils/errorCodes.js';

/**
 * Restringe la ruta a ciertos roles (403 si el rol no coincide). Va después de `authenticate`.
 * @param {...('estudiante' | 'instructor')} roles
 * @example cursoRoutes.post('/', authenticate, authorize(ROLES.INSTRUCTOR), validate({ body }), cursoController.create);
 */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) throw authRequired();
    if (!roles.includes(req.user.rol)) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'No tienes permiso para realizar esta acción');
    }
    next();
  };
