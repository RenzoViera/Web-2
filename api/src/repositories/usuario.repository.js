import { Usuario } from '../models/index.js';

// Columnas que devuelve la API (REGLAS B.20). Con `attributes` explícito el defaultScope no aplica: se decide aquí.
const PUBLIC_ATTRIBUTES = ['id', 'nombre', 'email', 'rol', 'createdAt'];
// Únicos campos que se pueden escribir: id, rol (en updates) y timestamps nunca vienen de afuera.
const CREATE_FIELDS = ['nombre', 'email', 'passwordHash', 'rol'];
const UPDATE_FIELDS = ['nombre', 'email', 'passwordHash'];

/**
 * @param {number} id
 * @returns {Promise<Usuario | null>}
 */
export const findById = (id) => Usuario.findByPk(id, { attributes: PUBLIC_ATTRIBUTES });

/**
 * Datos públicos + hash, solo para el login.
 * @param {string} email Ya normalizado (recortado y en minúsculas).
 * @returns {Promise<Usuario | null>}
 */
export const findByEmailWithPassword = (email) =>
  Usuario.findOne({ where: { email }, attributes: [...PUBLIC_ATTRIBUTES, 'passwordHash'] });

/**
 * @param {number} id
 * @returns {Promise<string | null>} null si el usuario no existe.
 */
export const findPasswordHash = async (id) => {
  const usuario = await Usuario.findByPk(id, { attributes: ['passwordHash'] });
  return usuario?.passwordHash ?? null;
};

/**
 * INSERT ... RETURNING de las columnas públicas. Un email repetido lanza UniqueConstraintError (lo traduce el servicio).
 * @param {{ nombre: string, email: string, passwordHash: string, rol: 'estudiante' | 'instructor' }} data
 * @returns {Promise<Usuario>}
 */
export const create = (data) => Usuario.create(data, { fields: CREATE_FIELDS, returning: PUBLIC_ATTRIBUTES });

/**
 * UPDATE ... RETURNING en una sola consulta.
 * @param {number} id
 * @param {{ nombre?: string, email?: string, passwordHash?: string }} changes Solo claves definidas.
 * @returns {Promise<Usuario | null>} null si el usuario no existe.
 */
export const update = async (id, changes) => {
  const [, rows] = await Usuario.update(changes, {
    where: { id },
    fields: UPDATE_FIELDS,
    returning: PUBLIC_ATTRIBUTES,
  });
  return rows[0] ?? null;
};
