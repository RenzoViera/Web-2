import * as preguntaService from '../services/pregunta.service.js';

export const create = async (req, res) => {
  res.status(201).json(await preguntaService.crearPregunta(req.leccion, req.body));
};

export const update = async (req, res) => {
  res.json(await preguntaService.actualizarPregunta(req.pregunta.id, req.body));
};

export const remove = async (req, res) => {
  await preguntaService.eliminarPregunta(req.pregunta);
  res.status(204).end();
};
