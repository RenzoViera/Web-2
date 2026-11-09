/**
 * @typedef {{ location?: 'params' | 'query' | 'body', field: string | null, message: string }} ApiErrorDetail
 */

/** Error normalizado de la API (formato `{ error: { code, message, details } }`). */
export class ApiError extends Error {
  /**
   * @param {{
   *   status: number,
   *   code: string,
   *   message: string,
   *   details?: ApiErrorDetail[] | null,
   *   requestId?: string | null,
   *   cause?: unknown,
   * }} params
   */
  constructor({ status, code, message, details = null, requestId = null, cause }) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

/**
 * Error esperado de la API (4xx de validación o negocio): se muestra con toast o en el estado de la vista.
 * Lo demás (5xx, red, bugs) se relanza para que lo muestre el manejador global (REGLAS C.34).
 * @param {unknown} error
 * @returns {error is ApiError}
 */
export const isExpectedApiError = (error) => error instanceof ApiError && error.status < 500;
