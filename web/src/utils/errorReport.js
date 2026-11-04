import { ApiError } from '@/api/ApiError';
import { isRequestCanceled } from '@/api/axiosClient';

/**
 * @typedef {object} ErrorReport
 * @property {string} name
 * @property {string} message
 * @property {string | null} code
 * @property {number | null} status
 * @property {string | null} requestId
 * @property {string} date
 * @property {string} user
 * @property {string} screen
 * @property {string | null} stack
 * @property {string | null} componentStack
 * @property {string} userAgent
 */

/** @type {{ id: number | string, email?: string, rol?: string } | null} */
let currentUser = null;

/**
 * Registra el usuario en sesión para incluirlo en los reportes (llamar desde AuthContext).
 * @param {{ id: number | string, email?: string, rol?: string } | null} user
 */
export const setErrorReportUser = (user) => {
  currentUser = user ? { id: user.id, email: user.email, rol: user.rol } : null;
};

const IGNORED_MESSAGES = [/ResizeObserver loop/i, /^Script error\.?$/i];
const EXTENSION_SOURCE = /^(chrome|moz|safari(-web)?)-extension:\/\//i;
const EXTENSION_FRAME = /(chrome|moz|safari(-web)?)-extension:\/\//i;

/** @param {unknown} value */
const toError = (value) => {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
};

/**
 * Cancelaciones, ruido del navegador y errores de extensiones no se reportan.
 * @param {unknown} error
 * @param {{ filename?: string }} [source]
 */
export const shouldIgnoreError = (error, { filename } = {}) => {
  if (isRequestCanceled(error)) return true;
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (filename && EXTENSION_SOURCE.test(filename)) return true;

  const { message, stack } = toError(error);
  if (IGNORED_MESSAGES.some((pattern) => pattern.test(message))) return true;

  // Si el primer frame del stack viene de una extensión, el error no es de la app.
  const firstFrame = stack?.split('\n').find((line) => /^\s*at\s|@/.test(line));
  return Boolean(firstFrame && EXTENSION_FRAME.test(firstFrame));
};

/**
 * @param {unknown} rawError
 * @param {{ componentStack?: string | null }} [extra]
 * @returns {ErrorReport}
 */
export const buildErrorReport = (rawError, { componentStack = null } = {}) => {
  const error = toError(rawError);
  const apiError = error instanceof ApiError ? error : null;

  return {
    name: error.name,
    message: error.message,
    code: apiError?.code ?? null,
    status: apiError?.status ?? null,
    requestId: apiError?.requestId ?? null,
    date: new Date().toISOString(),
    user: currentUser ? `${currentUser.id} · ${currentUser.email ?? ''} · ${currentUser.rol ?? ''}` : 'Sin sesión',
    screen: `${window.location.pathname}${window.location.search}`,
    stack: error.stack ?? null,
    componentStack: componentStack?.trim() || null,
    userAgent: navigator.userAgent,
  };
};

/**
 * Texto plano para copiar y enviar al administrador.
 * @param {ErrorReport} report
 */
export const formatErrorReport = (report) =>
  [
    `Fecha: ${report.date}`,
    `Pantalla: ${report.screen}`,
    `Usuario: ${report.user}`,
    `Error: ${report.name}: ${report.message}`,
    report.code && `Código: ${report.code}`,
    report.status !== null && `HTTP: ${report.status}`,
    report.requestId && `Request ID: ${report.requestId}`,
    `Navegador: ${report.userAgent}`,
    report.stack && `\nStack:\n${report.stack}`,
    report.componentStack && `\nComponentes:\n${report.componentStack}`,
  ]
    .filter(Boolean)
    .join('\n');
