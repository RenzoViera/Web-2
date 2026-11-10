import { axiosClient } from '@/api/axiosClient';

/**
 * @typedef {object} Pregunta Pregunta del editor del instructor dueño (incluye la respuesta correcta).
 * @property {number} id
 * @property {number} leccionId
 * @property {string} enunciado
 * @property {string[]} opciones
 * @property {number} indiceCorrecto
 * @property {string | null} explicacion
 *
 * @typedef {{ enunciado: string, opciones: string[], indiceCorrecto: number, explicacion?: string | null }} PreguntaPayload
 */

export const preguntasService = {
  /**
   * @param {number} leccionId Debe ser un cuestionario (422 si no).
   * @param {PreguntaPayload} payload
   * @returns {Promise<Pregunta>}
   */
  async crear(leccionId, payload) {
    const { data } = await axiosClient.post(`/lecciones/${leccionId}/preguntas`, payload);
    return data;
  },

  /**
   * Reemplaza la pregunta completa.
   * @param {number} id
   * @param {PreguntaPayload} payload
   * @returns {Promise<Pregunta>}
   */
  async actualizar(id, payload) {
    const { data } = await axiosClient.put(`/preguntas/${id}`, payload);
    return data;
  },

  /**
   * @param {number} id
   * @returns {Promise<void>}
   */
  async eliminar(id) {
    await axiosClient.delete(`/preguntas/${id}`);
  },
};
