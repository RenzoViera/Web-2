import { UniqueConstraintError } from 'sequelize';

/**
 * Indica si el error es una violación de un índice UNIQUE (opcionalmente sobre `campo`).
 * Los servicios lo usan para traducir errores esperables de la BD a 4xx (REGLAS B.5)
 * sin comparar textos de mensajes de Postgres.
 * @param {unknown} error
 * @param {string} [campo] Columna del índice único, p. ej. `'email'`.
 * @returns {boolean}
 */
export const isUniqueViolation = (error, campo) =>
  error instanceof UniqueConstraintError && (campo === undefined || Object.hasOwn(error.fields ?? {}, campo));
