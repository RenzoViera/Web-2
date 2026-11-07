import * as usuarioRepository from '../repositories/usuario.repository.js';
import { AppError } from '../utils/AppError.js';
import { isUniqueViolation } from '../utils/dbErrors.js';
import { ERROR_CODES } from '../utils/errorCodes.js';
import { toPublicUsuario } from '../utils/sanitizers.js';
import { emailTaken, hashPassword, invalidSession, verifyPassword } from './auth.service.js';

const WRONG_PASSWORD_MESSAGE = 'La contraseña actual no es correcta';

/**
 * RF-03: perfil propio. Si el token es válido pero el usuario ya no existe (p. ej. BD recreada),
 * responde 401 para que el cliente cierre la sesión.
 * @param {number} id
 * @returns {Promise<import('../utils/sanitizers.js').UsuarioPublico>}
 */
export const getProfile = async (id) => {
  const usuario = await usuarioRepository.findById(id);
  if (!usuario) throw invalidSession();
  return toPublicUsuario(usuario);
};

/**
 * RF-03: editar nombre, email o contraseña (el rol no es editable).
 * Cambiar la contraseña exige `passwordActual`. Sin cambio de contraseña es una sola consulta (UPDATE ... RETURNING).
 * @param {number} id
 * @param {{ nombre?: string, email?: string, password?: string, passwordActual?: string }} data
 * @returns {Promise<import('../utils/sanitizers.js').UsuarioPublico>}
 */
export const updateProfile = async (id, { nombre, email, password, passwordActual }) => {
  /** @type {{ nombre?: string, email?: string, passwordHash?: string }} */
  const changes = {};
  if (nombre !== undefined) changes.nombre = nombre;
  if (email !== undefined) changes.email = email;

  if (password !== undefined) {
    const passwordHash = await usuarioRepository.findPasswordHash(id);
    if (passwordHash === null) throw invalidSession();
    if (!(await verifyPassword(passwordActual ?? '', passwordHash))) {
      throw new AppError(422, ERROR_CODES.INVALID_CURRENT_PASSWORD, WRONG_PASSWORD_MESSAGE, [
        { location: 'body', field: 'passwordActual', message: WRONG_PASSWORD_MESSAGE },
      ]);
    }
    changes.passwordHash = await hashPassword(password);
  }

  let usuario;
  try {
    usuario = await usuarioRepository.update(id, changes);
  } catch (error) {
    if (isUniqueViolation(error, 'email')) throw emailTaken();
    throw error;
  }

  if (!usuario) throw invalidSession();
  return toPublicUsuario(usuario);
};
