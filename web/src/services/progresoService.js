import { axiosClient } from '@/api/axiosClient';

/**
 * @typedef {object} ProgresoLeccionItem
 * @property {number} id
 * @property {number} cursoId
 * @property {string} titulo
 * @property {import('./leccionesService').TipoLeccion} tipo
 * @property {number} orden
 * @property {number | null} notaMinima
 * @property {boolean} completada
 * @property {boolean} desbloqueada
 * @property {string | null} fechaCompletada
 *
 * @typedef {object} CursoProgreso
 * @property {{ id: number, titulo: string, estado: import('./cursosService').EstadoCurso }} curso
 * @property {boolean} completado
 * @property {number} totalLecciones
 * @property {number} leccionesCompletadas
 * @property {number} porcentaje
 * @property {number | null} siguienteLeccionId
 * @property {ProgresoLeccionItem[]} lecciones
 *
 * @typedef {object} PreguntaPublica Pregunta sin `indiceCorrecto` (RN-02).
 * @property {number} id
 * @property {number} leccionId
 * @property {string} enunciado
 * @property {string[]} opciones
 *
 * @typedef {object} LeccionEstudiante
 * @property {number} id
 * @property {number} cursoId
 * @property {string} titulo
 * @property {string | null} contenido
 * @property {string | null} videoUrl
 * @property {import('./leccionesService').TipoLeccion} tipo
 * @property {number} orden
 * @property {number | null} notaMinima
 * @property {boolean} completada
 * @property {string | null} fechaCompletada
 * @property {number | null} anteriorLeccionId
 * @property {number | null} siguienteLeccionId
 * @property {PreguntaPublica[]} preguntas
 *
 * @typedef {object} CompletarLeccionResponse
 * @property {number} leccionId
 * @property {boolean} completada
 * @property {string} fechaCompletada
 * @property {boolean} cursoCompletado
 * @property {number} totalLecciones
 * @property {number} leccionesCompletadas
 * @property {number} porcentaje
 * @property {number | null} siguienteLeccionId
 */

export const progresoService = {
  /**
   * Estado secuencial de las lecciones y porcentaje de avance del curso.
   * @param {number} cursoId
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<CursoProgreso>}
   */
  async getCursoProgreso(cursoId, options = {}) {
    const { data } = await axiosClient.get(`/cursos/${cursoId}/progreso`, { signal: options.signal });
    return data;
  },

  /**
   * Contenido de una lección desbloqueada (403 `LESSON_LOCKED` si está bloqueada).
   * @param {number} leccionId
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<LeccionEstudiante>}
   */
  async getLeccion(leccionId, options = {}) {
    const { data } = await axiosClient.get(`/lecciones/${leccionId}`, { signal: options.signal });
    return data;
  },

  /**
   * Marca una lección de contenido como completada y devuelve el avance actualizado.
   * @param {number} leccionId
   * @returns {Promise<CompletarLeccionResponse>}
   */
  async completarLeccion(leccionId) {
    const { data } = await axiosClient.post(`/lecciones/${leccionId}/completar`);
    return data;
  },
};
