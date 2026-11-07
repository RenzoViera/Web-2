/**
 * Sesión persistida en localStorage bajo una sola clave (token + usuario se escriben juntos, así un cambio
 * desde otra pestaña llega completo). Si el navegador bloquea el storage, la sesión vive solo en memoria.
 * Decisión y riesgos: docs/web/frontend.md (Sesión).
 */

import { ROLE_VALUES } from './roles';

/** @typedef {import('@/services/authService').AuthSession} AuthSession */

export const SESSION_KEY = 'miniaula.session';

/** Sesión en memoria cuando localStorage no está disponible (modo privado estricto, permisos). */
let memorySession = /** @type {AuthSession | null} */ (null);
let storageAvailable = true;

/**
 * Lo guardado se puede editar a mano: solo se acepta una sesión con la forma completa.
 * @param {unknown} value
 * @returns {value is AuthSession}
 */
const isSession = (value) => {
  if (!value || typeof value !== 'object') return false;
  const { token, user } = /** @type {{ token?: unknown, user?: Record<string, unknown> }} */ (value);
  return (
    typeof token === 'string' &&
    token.length > 0 &&
    typeof user === 'object' &&
    user !== null &&
    typeof user.id === 'number' &&
    typeof user.nombre === 'string' &&
    typeof user.email === 'string' &&
    ROLE_VALUES.includes(/** @type {import('@/services/authService').Rol} */ (user.rol)) &&
    typeof user.createdAt === 'string' &&
    !Number.isNaN(Date.parse(user.createdAt))
  );
};

/** @param {AuthSession | null} session */
const write = (session) => {
  memorySession = session;
  if (!storageAvailable) return;
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage bloqueado o lleno: se sigue con la sesión en memoria.
    storageAvailable = false;
  }
};

/**
 * Sesión guardada y con forma válida; si lo guardado está corrupto, se borra.
 * @returns {AuthSession | null}
 */
export const readStoredSession = () => {
  if (!storageAvailable) return memorySession;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (isSession(session)) return session;
  } catch {
    // JSON corrupto o storage inaccesible: se descarta lo guardado.
  }
  write(null);
  return null;
};

/**
 * Token actual. Se lee del storage en cada request: si el usuario borra la sesión a mano, el siguiente
 * request sale sin token, la API responde 401 y la app cierra la sesión.
 * @returns {string | null}
 */
export const getStoredToken = () => readStoredSession()?.token ?? null;

/** @param {AuthSession} session */
export const storeSession = (session) => write(session);

export const clearStoredSession = () => write(null);
