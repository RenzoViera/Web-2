/** @typedef {import('@/services/authService').Rol} Rol */

/** Rutas de la SPA. Usar siempre estas constantes, nunca strings sueltos. */
export const PATHS = Object.freeze({
  home: '/',
  login: '/login',
  registro: '/registro',
  perfil: '/perfil',
  catalogo: '/cursos',
  cursoDetalle: '/cursos/:id',
  /** Vista de lección del estudiante (página real en el paso 07). */
  leccion: '/cursos/:cursoId/lecciones/:leccionId',
  misCursos: '/mis-cursos',
  instructorCursos: '/instructor/cursos',
  instructorNuevoCurso: '/instructor/cursos/nuevo',
  instructorEditarCurso: '/instructor/cursos/:id/editar',
  instructorNuevaLeccion: '/instructor/cursos/:cursoId/lecciones/nueva',
  instructorEditarLeccion: '/instructor/cursos/:cursoId/lecciones/:leccionId/editar',
  /** Rutas hijas del editor de lección: modal de pregunta con URL propia (REGLAS C.40). */
  instructorNuevaPregunta: 'preguntas/nueva',
  instructorEditarPregunta: 'preguntas/:preguntaId',
});

/** @param {number | string} id */
export const cursoDetallePath = (id) => `/cursos/${id}`;

/**
 * @param {number | string} cursoId
 * @param {number | string} leccionId
 */
export const leccionPath = (cursoId, leccionId) => `/cursos/${cursoId}/lecciones/${leccionId}`;

/**
 * Genera la ruta para editar un curso.
 * @param {number | string} id
 */
export const instructorEditarCursoPath = (id) => `/instructor/cursos/${id}/editar`;

/** @param {number | string} cursoId */
export const instructorNuevaLeccionPath = (cursoId) => `/instructor/cursos/${cursoId}/lecciones/nueva`;

/**
 * @param {number | string} cursoId
 * @param {number | string} leccionId
 */
export const instructorEditarLeccionPath = (cursoId, leccionId) =>
  `/instructor/cursos/${cursoId}/lecciones/${leccionId}/editar`;

/**
 * Modal de pregunta sobre el editor de lección; sin `preguntaId` abre el de creación.
 * @param {number | string} cursoId
 * @param {number | string} leccionId
 * @param {number | string} [preguntaId]
 */
export const instructorPreguntaPath = (cursoId, leccionId, preguntaId) =>
  `${instructorEditarLeccionPath(cursoId, leccionId)}/preguntas/${preguntaId ?? 'nueva'}`;

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
