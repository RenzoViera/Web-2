/** Roles de usuario (mismos valores que el ENUM `usuarios.rol`). */
export const ROLES = Object.freeze({
  ESTUDIANTE: 'estudiante',
  INSTRUCTOR: 'instructor',
});

/** @type {readonly ['estudiante', 'instructor']} */
export const ROLE_VALUES = Object.freeze([ROLES.ESTUDIANTE, ROLES.INSTRUCTOR]);
