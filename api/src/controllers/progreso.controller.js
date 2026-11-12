import * as progresoService from '../services/progreso.service.js';

export const getCursoProgreso = async (req, res) => {
  res.json(await progresoService.obtenerProgresoCurso(req.user.id, req.curso));
};

export const getLeccion = async (req, res) => {
  res.json(await progresoService.obtenerLeccionEstudiante(req.user.id, req.leccion));
};

export const completarLeccion = async (req, res) => {
  res.json(await progresoService.completarLeccion(req.user.id, req.leccion));
};
