/**
 * @typedef {object} UsuarioPublico
 * @property {number} id
 * @property {string} nombre
 * @property {string} email
 * @property {'estudiante' | 'instructor'} rol
 * @property {Date} createdAt
 */

/**
 * Única forma de exponer un usuario: lista blanca de campos, nunca `passwordHash` (REGLAS B.7).
 * @param {{ get?: (options: { plain: true }) => object } & Record<string, unknown>} usuario Instancia de Sequelize u objeto plano.
 * @returns {UsuarioPublico}
 */
export const toPublicUsuario = (usuario) => {
  const data = typeof usuario.get === 'function' ? usuario.get({ plain: true }) : usuario;
  return { id: data.id, nombre: data.nombre, email: data.email, rol: data.rol, createdAt: data.createdAt };
};
