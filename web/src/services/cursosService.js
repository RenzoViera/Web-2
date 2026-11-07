import { axiosClient } from '@/api/axiosClient';

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
 * @typedef {object} InstructorCursoDetalle
 * @property {number} id
 * @property {number} instructorId
 * @property {string} titulo
 * @property {string | null} descripcion
 * @property {string} categoria
 * @property {NivelCurso} nivel
 * @property {EstadoCurso} estado
 * @property {string | null} imagenUrl
 * @property {Array<{ id: number, titulo: string, contenido: string | null, tipo: 'contenido' | 'cuestionario', orden: number, preguntas?: Array<{ id: number, enunciado: string, opciones: string[], indiceCorrecto: number, explicacion: string | null }> }>} lecciones
 *
 * @typedef {object} PaginatedResponse<T>
 * @property {T[]} data
 * @property {{ page: number, limit: number, total: number, totalPages: number }} meta
 */

export const cursosService = {
  /**
   * Catálogo público de cursos.
   * @param {{ q?: string, categoria?: string, nivel?: string, page?: number, limit?: number }} [params]
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<PaginatedResponse<CursoBase & { totalLecciones: number, instructor: { id: number, nombre: string } }>>}
   */
  async getCursos(params = {}, options = {}) {
    const { data } = await axiosClient.get('/cursos', { params, signal: options.signal });
    return data;
  },

  /**
   * Detalle público de un curso publicado.
   * @param {number} id
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<CursoBase & { instructor: { id: number, nombre: string }, lecciones: Array<{ id: number, titulo: string, tipo: string, orden: number }> }>}
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
