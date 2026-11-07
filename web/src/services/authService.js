import { axiosClient } from '@/api/axiosClient';
import { dedupeRequest } from '@/utils/dedupeRequest';

/**
 * @typedef {'estudiante' | 'instructor'} Rol
 *
 * @typedef {object} Usuario Usuario público (la API nunca envía `passwordHash`).
 * @property {number} id
 * @property {string} nombre
 * @property {string} email
 * @property {Rol} rol
 * @property {string} createdAt Fecha ISO 8601.
 *
 * @typedef {{ user: Usuario, token: string }} AuthSession
 * @typedef {{ nombre: string, email: string, password: string, rol: Rol }} RegisterData
 * @typedef {{ email: string, password: string }} LoginData
 * @typedef {{ nombre?: string, email?: string, password?: string, passwordActual?: string }} UpdateMeData
 *   `passwordActual` es obligatoria solo si se envía `password`. El rol no es editable.
 */

/**
 * POST /auth/register → 201. 409 si el email ya existe.
 * @param {RegisterData} data
 * @returns {Promise<AuthSession>}
 */
export const register = async (data) => (await axiosClient.post('/auth/register', data)).data;

/**
 * POST /auth/login. 401 con mensaje genérico si las credenciales no coinciden; 429 tras 5 fallos por minuto.
 * @param {LoginData} data
 * @returns {Promise<AuthSession>}
 */
export const login = async (data) => (await axiosClient.post('/auth/login', data)).data;

/**
 * GET /users/me. Comparte la petición en curso (doble montaje de StrictMode).
 * @returns {Promise<Usuario>}
 */
export const getMe = () => dedupeRequest('GET /users/me', async () => (await axiosClient.get('/users/me')).data);

/**
 * PUT /users/me. Devuelve el usuario actualizado.
 * @param {UpdateMeData} data
 * @returns {Promise<Usuario>}
 */
export const updateMe = async (data) => (await axiosClient.put('/users/me', data)).data;
