/** @typedef {import('@/services/authService').Rol} Rol */

/** Rutas de la SPA. Usar siempre estas constantes, nunca strings sueltos. */
export const PATHS = Object.freeze({
  home: '/',
  login: '/login',
  registro: '/registro',
  perfil: '/perfil',
  catalogo: '/cursos',
  misCursos: '/mis-cursos',
  instructorCursos: '/instructor/cursos',
  instructorNuevoCurso: '/instructor/cursos/nuevo',
  instructorEditarCurso: '/instructor/cursos/:id/editar',
});

/**
 * Genera la ruta para editar un curso.
 * @param {number | string} id
 */
export const instructorEditarCursoPath = (id) => `/instructor/cursos/${id}/editar`;

/** @type {Readonly<Record<Rol, string>>} */
const ROLE_HOME = Object.freeze({
  estudiante: PATHS.misCursos,
  instructor: PATHS.instructorCursos,
});

/**
 * Inicio de cada rol: destino tras iniciar sesión y al entrar a una sección de otro rol.
 * @param {Rol} rol
 */
export const homePathFor = (rol) => ROLE_HOME[rol];
