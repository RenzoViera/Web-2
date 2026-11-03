import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../utils/errorCodes.js';

export const notFound = (req) => {
  throw new AppError(404, ERROR_CODES.ROUTE_NOT_FOUND, `Ruta ${req.method} ${req.originalUrl} no encontrada`);
};
