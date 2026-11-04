/**
 * Error HTTP/de negocio con formato único de respuesta.
 * @example throw new AppError(403, ERROR_CODES.FORBIDDEN, 'No eres dueño de este curso');
 */
export class AppError extends Error {
  /**
   * @param {number} status Código HTTP.
   * @param {string} code Código estable para el cliente (ver ERROR_CODES).
   * @param {string} message Mensaje legible para el usuario.
   * @param {Array<object> | null} [details] Detalle opcional (p. ej. errores por campo).
   */
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
