import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as usuarioRepository from '../repositories/usuario.repository.js';
import { AppError } from '../utils/AppError.js';
import { isUniqueViolation } from '../utils/dbErrors.js';
import { ERROR_CODES } from '../utils/errorCodes.js';
import { toPublicUsuario } from '../utils/sanitizers.js';
import { tokenPayloadSchema } from '../validators/auth.validator.js';

/** @typedef {'estudiante' | 'instructor'} Rol */
/** @typedef {{ id: number, rol: Rol }} SessionUser Lo que viaja en el JWT y queda en `req.user`. */
/** @typedef {{ user: import('../utils/sanitizers.js').UsuarioPublico, token: string }} AuthSession */

// 2^10 rondas (~70 ms por hash): mínimo recomendado por OWASP y el mismo costo que usa el seed.
const SALT_ROUNDS = 10;
const JWT_ALGORITHM = 'HS256';

// Si el email no existe se compara igual contra este hash: el login tarda lo mismo y no revela qué emails existen.
const DUMMY_HASH = await bcrypt.hash(randomBytes(32).toString('hex'), SALT_ROUNDS);

const SESSION_REQUIRED_MESSAGE = 'Debes iniciar sesión para continuar';
const EMAIL_TAKEN_MESSAGE = 'Ya existe una cuenta con ese email';

export const authRequired = () => new AppError(401, ERROR_CODES.UNAUTHORIZED, SESSION_REQUIRED_MESSAGE);

export const invalidSession = () =>
  new AppError(401, ERROR_CODES.INVALID_TOKEN, 'Tu sesión no es válida. Inicia sesión nuevamente.');

export const emailTaken = () =>
  new AppError(409, ERROR_CODES.EMAIL_TAKEN, EMAIL_TAKEN_MESSAGE, [
    { location: 'body', field: 'email', message: EMAIL_TAKEN_MESSAGE },
  ]);

/** @param {string} plain */
export const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

/**
 * Compara una contraseña con su hash. Sin hash (usuario inexistente) compara contra DUMMY_HASH y devuelve false.
 * @param {string} plain
 * @param {string | null | undefined} hash
 * @returns {Promise<boolean>}
 */
export const verifyPassword = async (plain, hash) => {
  const matches = await bcrypt.compare(plain, hash ?? DUMMY_HASH);
  return Boolean(hash) && matches;
};

/**
 * @param {SessionUser} usuario
 * @returns {string} JWT HS256 con `{ id, rol }` que expira según JWT_EXPIRES_IN.
 */
export const signToken = ({ id, rol }) =>
  jwt.sign({ id, rol }, env.jwt.secret, { algorithm: JWT_ALGORITHM, expiresIn: env.jwt.expiresIn });

/**
 * Verifica firma, algoritmo, expiración y forma del payload. No consulta la BD (REGLAS B.27):
 * el token firmado ya trae id y rol, y el rol no es editable.
 * @param {string} token
 * @returns {SessionUser}
 */
export const verifyToken = (token) => {
  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret, { algorithms: [JWT_ALGORITHM] });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, ERROR_CODES.TOKEN_EXPIRED, 'Tu sesión expiró. Inicia sesión nuevamente.');
    }
    throw invalidSession();
  }

  const parsed = tokenPayloadSchema.safeParse(payload);
  if (!parsed.success) throw invalidSession();
  return parsed.data;
};

/**
 * @param {import('../models/Usuario.js').Usuario} usuario
 * @returns {AuthSession}
 */
const buildSession = (usuario) => ({ user: toPublicUsuario(usuario), token: signToken(usuario) });

/**
 * RF-01: registro con rol. Una sola consulta (INSERT ... RETURNING); el email repetido se detecta por el UNIQUE.
 * @param {{ nombre: string, email: string, password: string, rol: Rol }} data
 * @returns {Promise<AuthSession>}
 */
export const register = async ({ nombre, email, password, rol }) => {
  const passwordHash = await hashPassword(password);
  try {
    return buildSession(await usuarioRepository.create({ nombre, email, passwordHash, rol }));
  } catch (error) {
    if (isUniqueViolation(error, 'email')) throw emailTaken();
    throw error;
  }
};

/**
 * RF-02: login. Mismo 401 genérico si el email no existe o la contraseña no coincide.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<AuthSession>}
 */
export const login = async ({ email, password }) => {
  const usuario = await usuarioRepository.findByEmailWithPassword(email);
  const passwordMatches = await verifyPassword(password, usuario?.passwordHash);
  if (!usuario || !passwordMatches) {
    throw new AppError(401, ERROR_CODES.INVALID_CREDENTIALS, 'Email o contraseña incorrectos');
  }
  return buildSession(usuario);
};
