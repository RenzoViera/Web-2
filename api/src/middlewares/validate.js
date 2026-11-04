import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../utils/errorCodes.js';

const SOURCES = /** @type {const} */ (['params', 'query', 'body']);

const toDetails = (issues, location) =>
  issues.map((issue) => ({
    location,
    field: issue.path.join('.') || null,
    message: issue.message,
  }));

// En Express 5 `req.query` es un getter: se redefine la propiedad para exponer el valor parseado.
const replace = (req, source, value) => {
  Object.defineProperty(req, source, { value, writable: true, configurable: true, enumerable: true });
};

/**
 * Valida y normaliza params/query/body con esquemas Zod.
 * Body inválido → 422; params/query inválidos → 400.
 * @param {{ params?: import('zod').ZodType, query?: import('zod').ZodType, body?: import('zod').ZodType }} schemas
 */
export const validate = (schemas) => (req, _res, next) => {
  const details = [];

  for (const source of SOURCES) {
    const schema = schemas[source];
    if (!schema) continue;

    const result = schema.safeParse(req[source] ?? {});
    if (result.success) replace(req, source, result.data);
    else details.push(...toDetails(result.error.issues, source));
  }

  if (details.length === 0) return next();

  const onlyBody = details.every((detail) => detail.location === 'body');
  throw onlyBody
    ? new AppError(422, ERROR_CODES.VALIDATION_ERROR, 'Los datos enviados no son válidos', details)
    : new AppError(400, ERROR_CODES.BAD_REQUEST, 'Parámetros de la solicitud inválidos', details);
};
