/**
 * Página de origen al exigir sesión: ProtectedRoute la guarda en el `state` de la navegación a /login
 * y GuestRoute vuelve a ella después de iniciar sesión o registrarse.
 */

/**
 * @param {{ pathname: string, search: string, hash: string }} location
 * @returns {{ from: string }}
 */
export const buildRedirectState = ({ pathname, search, hash }) => ({ from: `${pathname}${search}${hash}` });

/**
 * Ruta de origen guardada, solo si es interna (empieza con una sola `/`).
 * @param {unknown} state `location.state`
 * @returns {string | null}
 */
export const getRedirectPath = (state) => {
  const from = state && typeof state === 'object' ? /** @type {{ from?: unknown }} */ (state).from : undefined;
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : null;
};
