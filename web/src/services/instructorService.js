import { axiosClient } from '@/api/axiosClient';

/**
 * @typedef {object} MetricasGlobales
 * @property {{ total: number, publicados: number, borradores: number, archivados: number }} cursos
 * @property {number} totalLecciones
 * @property {number} totalInscritos
 * @property {number} totalCompletados
 * @property {number} tasaCompletitud
 */

/**
 * @typedef {object} MetricasCurso
 * @property {number} totalInscritos
 * @property {number} totalCompletados
 * @property {number} tasaCompletitud
 * @property {number} promedioProgreso
 * @property {number} totalLecciones
 */

/**
 * @typedef {object} QuizStats
 * @property {number} totalIntentos
 * @property {number} promedioPuntaje
 * @property {number} totalEstudiantes
 * @property {number} aprobados
 * @property {number} tasaAprobacion
 */

/**
 * @typedef {object} LeccionMetricaItem
 * @property {number} id
 * @property {string} titulo
 * @property {import('./leccionesService').TipoLeccion} tipo
 * @property {number} orden
 * @property {number | null} notaMinima
 * @property {number} completados
 * @property {number} tasaCompletitud
 * @property {QuizStats | null} quizStats
 */

/**
 * @typedef {object} CursoResumenData
 * @property {import('./cursosService').CursoBase} curso
 * @property {MetricasCurso} metricas
 * @property {LeccionMetricaItem[]} lecciones
 */

/**
 * @typedef {object} EstudianteInscritoItem
 * @property {number} inscripcionId
 * @property {{ id: number, nombre: string, email: string }} estudiante
 * @property {string} fechaInscripcion
 * @property {boolean} completado
 * @property {number} leccionesCompletadas
 * @property {number} totalLecciones
 * @property {number} porcentaje
 */

/**
 * @template T
 * @typedef {import('./cursosService').PaginatedResponse<T>} PaginatedResponse
 */

export const instructorService = {
  /**
   * Resumen global acumulado de cursos, lecciones, inscritos y finalizaciones del instructor.
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<MetricasGlobales>}
   */
  async getResumenGlobal(options = {}) {
    const response = await axiosClient.get('/instructor/resumen', options);
    return response.data;
  },

  /**
   * Resumen métrico y avance por lección de un curso específico.
   * @param {number | string} cursoId
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<CursoResumenData>}
   */
  async getCursoResumen(cursoId, options = {}) {
    const response = await axiosClient.get(`/instructor/cursos/${cursoId}/resumen`, options);
    return response.data;
  },

  /**
   * Listado paginado de estudiantes inscritos en un curso con su avance.
   * @param {number | string} cursoId
   * @param {{ page?: number, limit?: number, q?: string, completado?: boolean }} [params]
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<PaginatedResponse<EstudianteInscritoItem>>}
   */
  async getCursoEstudiantes(cursoId, params = {}, options = {}) {
    const response = await axiosClient.get(`/instructor/cursos/${cursoId}/estudiantes`, {
      params,
      ...options,
    });
    return response.data;
  },
};
