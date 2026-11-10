import { axiosClient } from '@/api/axiosClient';

/**
 * @typedef {'contenido' | 'cuestionario'} TipoLeccion
 *
 * @typedef {object} Leccion Lección tal como la ve el editor del instructor.
 * @property {number} id
 * @property {number} cursoId
 * @property {string} titulo
 * @property {string | null} contenido
 * @property {string | null} videoUrl Solo contenido.
 * @property {TipoLeccion} tipo
 * @property {number} orden
 * @property {number | null} notaMinima Solo cuestionario (0-100).
 *
 * @typedef {{ tipo: 'contenido', titulo: string, contenido?: string | null, videoUrl?: string | null }
 *   | { tipo: 'cuestionario', titulo: string, contenido?: string | null, notaMinima: number }} CrearLeccionPayload
 *
 * @typedef {{ titulo?: string, contenido?: string | null, videoUrl?: string | null, notaMinima?: number }} ActualizarLeccionPayload
 *   El tipo no es editable.
 */

export const leccionesService = {
  /**
   * Crea una lección al final del temario.
   * @param {number} cursoId
   * @param {CrearLeccionPayload} payload
   * @returns {Promise<Leccion>}
   */
  async crear(cursoId, payload) {
    const { data } = await axiosClient.post(`/cursos/${cursoId}/lecciones`, payload);
    return data;
  },

  /**
   * @param {number} id
   * @param {ActualizarLeccionPayload} payload
   * @returns {Promise<Leccion>}
   */
  async actualizar(id, payload) {
    const { data } = await axiosClient.put(`/lecciones/${id}`, payload);
    return data;
  },

  /**
   * Borra la lección; la API recompacta el orden (409 si el curso tiene inscritos).
   * @param {number} id
   * @returns {Promise<void>}
   */
  async eliminar(id) {
    await axiosClient.delete(`/lecciones/${id}`);
  },

  /**
   * Reordena el temario completo.
   * @param {number} cursoId
   * @param {number[]} ids Todas las lecciones del curso en el orden nuevo.
   * @returns {Promise<Leccion[]>} Lecciones con su `orden` actualizado.
   */
  async reordenar(cursoId, ids) {
    const { data } = await axiosClient.patch(`/cursos/${cursoId}/lecciones/orden`, { ids });
    return data;
  },
};
