import * as inscripcionService from '../services/inscripcion.service.js';

export const create = async (req, res) => {
  res.status(201).json(await inscripcionService.inscribir(req.user.id, Number(req.params.id)));
};

export const listMias = async (req, res) => {
  res.json(await inscripcionService.obtenerMisInscripciones(req.user.id, req.query));
};
