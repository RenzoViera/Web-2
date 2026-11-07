import { createContext } from 'react';

/**
 * @typedef {import('@/services/authService').Usuario} Usuario
 *
 * @typedef {object} AuthContextValue
 * @property {Usuario | null} user Usuario en sesión (`null` sin sesión).
 * @property {string | null} token JWT actual.
 * @property {(data: import('@/services/authService').LoginData) => Promise<Usuario>} login
 * @property {(data: import('@/services/authService').RegisterData) => Promise<Usuario>} register
 * @property {() => void} logout Cierre de sesión stateless: el cliente borra el token.
 * @property {(changes: import('@/services/authService').UpdateMeData) => Promise<Usuario>} updateProfile
 */

/** @type {import('react').Context<AuthContextValue | null>} */
export const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));
