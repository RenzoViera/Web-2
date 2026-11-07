/** @type {Map<string, Promise<unknown>>} */
const inFlight = new Map();

/**
 * Comparte la petición en curso que tenga la misma clave (p. ej. el doble montaje de StrictMode).
 * No cachea resultados: al terminar la petición la clave se libera (REGLAS C.28).
 * @template T
 * @param {string} key Función + parámetros serializados, p. ej. `'GET /users/me'`.
 * @param {() => Promise<T>} request
 * @returns {Promise<T>}
 */
export const dedupeRequest = (key, request) => {
  const pending = inFlight.get(key);
  if (pending) return /** @type {Promise<T>} */ (pending);

  const promise = request().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
};
