import { axiosClient } from '@/api/axiosClient';
import { dedupeRequest } from '@/utils/dedupeRequest';

/**
 * @typedef {'principiante' | 'intermedio' | 'avanzado'} NivelCurso
 * @typedef {'borrador' | 'publicado' | 'archivado'} EstadoCurso
 *
 * @typedef {object} CursoBase
 * @property {number} id
 * @property {number} instructorId
 * @property {string} titulo
 * @property {string | null} descripcion
 * @property {string} categoria
 * @property {NivelCurso} nivel
 * @property {EstadoCurso} estado
 * @property {string | null} imagenUrl
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {CursoBase & { totalLecciones: number, totalInscritos: number }} InstructorCursoItem
 *
 * @typedef {{ id: number, nombre: string }} InstructorResumen
 *
 * @typedef {CursoBase & { totalLecciones: number, instructor: InstructorResumen }} CursoCatalogo
 *
 * @typedef {{ id: number, titulo: string, tipo: import('./leccionesService').TipoLeccion, orden: number }} LeccionTemario
 *   Lección del temario público: sin contenido, video ni preguntas.
 *
 * @typedef {object} CursoDetallePublico
 * @property {number} id
 * @property {number} instructorId
 * @property {string} titulo
 * @property {string | null} descripcion
 * @property {string} categoria
 * @property {NivelCurso} nivel
 * @property {EstadoCurso} estado
 * @property {string | null} imagenUrl
 * @property {string} createdAt
 * @property {InstructorResumen} instructor
 * @property {LeccionTemario[]} lecciones
 * @property {boolean | null} inscrito true/false si consulta un estudiante; null para visitantes e instructores.
 *
 * @typedef {{ q?: string, categoria?: string, nivel?: NivelCurso, page?: number, limit?: number }} CatalogoParams
 *
 * @typedef {object} InstructorCursoDetalle
 * @property {number} id
 * @property {number} instructorId
 * @property {string} titulo
 * @property {string | null} descripcion
 * @property {string} categoria
 * @property {NivelCurso} nivel
 * @property {EstadoCurso} estado
 * @property {string | null} imagenUrl
 * @property {Array<import('./leccionesService').Leccion & { preguntas: import('./preguntasService').Pregunta[] }>} lecciones
 */

/**
 * Respuesta de los listados paginados de la API.
 * @template T
 * @typedef {object} PaginatedResponse
 * @property {T[]} data
 * @property {{ page: number, limit: number, total: number, totalPages: number }} meta
 */

export const cursosService = {
  /**
   * Catálogo público de cursos publicados.
   * @param {CatalogoParams} [params]
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<PaginatedResponse<CursoCatalogo>>}
   */
  async getCursos(params = {}, options = {}) {
    const { data } = await axiosClient.get('/cursos', { params, signal: options.signal });
    return data;
  },

  /**
   * Categorías con cursos publicados (chips del catálogo). Comparte la petición en curso (REGLAS C.28).
   * @returns {Promise<{ data: string[], truncated: boolean }>}
   */
  getCategorias() {
    return dedupeRequest('GET /cursos/categorias', async () => (await axiosClient.get('/cursos/categorias')).data);
  },

  /**
   * Detalle público de un curso publicado. Con sesión de estudiante incluye `inscrito`.
   * @param {number} id
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<CursoDetallePublico>}
   */
  async getCursoDetalle(id, options = {}) {
    const { data } = await axiosClient.get(`/cursos/${id}`, { signal: options.signal });
    return data;
  },

  /**
   * Listado paginado de cursos del instructor autenticado.
   * @param {{ page?: number, limit?: number }} [params]
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<PaginatedResponse<InstructorCursoItem>>}
   */
  async getInstructorCursos(params = {}, options = {}) {
    const { data } = await axiosClient.get('/instructor/cursos', { params, signal: options.signal });
    return data;
  },

  /**
   * Detalle completo del curso para edición del instructor.
   * @param {number} id
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<InstructorCursoDetalle>}
   */
  async getInstructorCurso(id, options = {}) {
    const { data } = await axiosClient.get(`/instructor/cursos/${id}`, { signal: options.signal });
    return data;
  },

  /**
   * Crea un curso nuevo (en estado borrador).
   * @param {{ titulo: string, descripcion?: string | null, categoria: string, nivel: NivelCurso, imagenUrl?: string | null }} payload
   * @returns {Promise<CursoBase>}
   */
  async crearCurso(payload) {
    const { data } = await axiosClient.post('/cursos', payload);
    return data;
  },

  /**
   * Actualiza los datos de un curso del instructor.
   * @param {number} id
   * @param {{ titulo?: string, descripcion?: string | null, categoria?: string, nivel?: NivelCurso, imagenUrl?: string | null }} payload
   * @returns {Promise<CursoBase>}
   */
  async actualizarCurso(id, payload) {
    const { data } = await axiosClient.put(`/cursos/${id}`, payload);
    return data;
  },

  /**
   * Cambia el estado del curso (borrador, publicado, archivado).
   * @param {number} id
   * @param {EstadoCurso} estado
   * @returns {Promise<CursoBase>}
   */
  async cambiarEstadoCurso(id, estado) {
    const { data } = await axiosClient.patch(`/cursos/${id}/estado`, { estado });
    return data;
  },

  /**
   * Elimina un curso sin estudiantes inscritos.
   * @param {number} id
   * @returns {Promise<void>}
   */
  async eliminarCurso(id) {
    await axiosClient.delete(`/cursos/${id}`);
  },
};
