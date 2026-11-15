import { axiosClient } from '@/api/axiosClient';

/**
 * @typedef {object} RespuestaIntento
 * @property {number} preguntaId
 * @property {number} indice Posición (desde 0) de la opción elegida.
 *
 * @typedef {object} IntentoResultado Resultado de un intento: la nota, nunca cuáles eran las correctas (RN-02).
 * @property {number} leccionId
 * @property {number} nota 0-100.
 * @property {boolean} aprobado Si este intento alcanzó la nota mínima.
 * @property {number} aciertos
 * @property {number} totalPreguntas
 * @property {number} notaMinima
 * @property {boolean} completada Si el cuestionario quedó completado (mejor nota ≥ mínima).
 * @property {string | null} fechaCompletada
 * @property {import('./progresoService').ResumenIntentos} intentos
 * @property {boolean} cursoCompletado
 * @property {number} totalLecciones
 * @property {number} leccionesCompletadas
 * @property {number} porcentaje
 * @property {number | null} siguienteLeccionId
 */

export const intentosService = {
  /**
   * Rinde un cuestionario. La API califica y responde 403 `ATTEMPTS_EXHAUSTED` sin intentos disponibles.
   * @param {number} leccionId
   * @param {RespuestaIntento[]} respuestas Una por cada pregunta del cuestionario.
   * @returns {Promise<IntentoResultado>}
   */
  async rendir(leccionId, respuestas) {
    const { data } = await axiosClient.post(`/lecciones/${leccionId}/intentos`, { respuestas });
    return data;
  },
};
