import * as instructorService from '../services/instructor.service.js';

/**
 * Resumen global de métricas del instructor autenticado.
 */
export const getResumen = async (req, res) => {
  const resumen = await instructorService.obtenerResumenGlobal(req.user.id);
  res.status(200).json(resumen);
};

/**
 * Resumen métrico y avance por lección de un curso del instructor.
 */
export const getCursoResumen = async (req, res) => {
  const resumen = await instructorService.obtenerCursoResumen(req.curso);
  res.status(200).json(resumen);
};

/**
 * Listado paginado de estudiantes de un curso con avance.
 */
export const getCursoEstudiantes = async (req, res) => {
  const resultado = await instructorService.obtenerCursoEstudiantes(req.curso.id, req.query);
  res.status(200).json(resultado);
};
