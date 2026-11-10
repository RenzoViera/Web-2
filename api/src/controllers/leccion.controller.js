import * as leccionService from '../services/leccion.service.js';

export const create = async (req, res) => {
  res.status(201).json(await leccionService.crearLeccion(req.curso.id, req.body));
};

export const update = async (req, res) => {
  res.json(await leccionService.actualizarLeccion(req.leccion, req.body));
};

export const remove = async (req, res) => {
  await leccionService.eliminarLeccion(req.leccion);
  res.status(204).end();
};

export const reorder = async (req, res) => {
  res.json(await leccionService.reordenarLecciones(req.curso.id, req.body.ids));
};
