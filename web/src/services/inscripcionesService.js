import { axiosClient } from '@/api/axiosClient';

/**
 * @typedef {object} Inscripcion
 * @property {number} id
 * @property {number} usuarioId
 * @property {number} cursoId
 * @property {string} createdAt
 *
 * @typedef {object} MiInscripcion Fila de "Mis cursos".
 * @property {number} id
 * @property {number} cursoId
 * @property {string} fechaInscripcion
 * @property {{
 *   id: number,
 *   titulo: string,
 *   categoria: string,
 *   nivel: import('./cursosService').NivelCurso,
 *   estado: import('./cursosService').EstadoCurso,
 *   imagenUrl: string | null,
 *   instructor: import('./cursosService').InstructorResumen,
 * }} curso
 * @property {number} totalLecciones
 * @property {number} leccionesCompletadas
 * @property {number} porcentaje 0-100, calculado por la API.
 * @property {number | null} siguienteLeccionId Primera lección sin completar (o la primera si completó todas).
 */

export const inscripcionesService = {
  /**
   * Inscribe al estudiante autenticado. 409 `ALREADY_ENROLLED` si ya estaba inscrito.
   * @param {number} cursoId
   * @returns {Promise<Inscripcion>}
   */
  async inscribirse(cursoId) {
    const { data } = await axiosClient.post(`/cursos/${cursoId}/inscripcion`);
    return data;
  },

  /**
   * Cursos en los que está inscrito el estudiante autenticado, con su avance.
   * @param {{ page?: number, limit?: number }} [params]
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<import('./cursosService').PaginatedResponse<MiInscripcion>>}
   */
  async getMisInscripciones(params = {}, options = {}) {
    const { data } = await axiosClient.get('/inscripciones/mias', { params, signal: options.signal });
    return data;
  },
};
