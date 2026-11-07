import { createContext } from 'react';

/**
 * @typedef {'success' | 'error' | 'warning' | 'info'} ToastVariant
 *
 * @typedef {object} Toast
 * @property {number} id
 * @property {ToastVariant} variant
 * @property {string} message
 * @property {number} duration Milisegundos visibles (se pausa con el puntero o el foco encima).
 *
 * @typedef {object} ToastApi
 * @property {(message: string) => void} success
 * @property {(message: string) => void} error
 * @property {(message: string) => void} warning
 * @property {(message: string) => void} info
 */

/** @type {import('react').Context<ToastApi | null>} */
export const ToastContext = createContext(/** @type {ToastApi | null} */ (null));
