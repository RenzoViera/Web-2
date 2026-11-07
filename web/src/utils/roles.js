/** @typedef {import('@/services/authService').Rol} Rol */

/** Roles de usuario (mismos valores que la API). */
export const ROLES = Object.freeze({
  ESTUDIANTE: /** @type {'estudiante'} */ ('estudiante'),
  INSTRUCTOR: /** @type {'instructor'} */ ('instructor'),
});

/** @type {ReadonlyArray<Rol>} */
export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

/** @type {Readonly<Record<Rol, string>>} */
export const ROLE_LABELS = Object.freeze({
  estudiante: 'Estudiante',
  instructor: 'Instructor',
});
