import * as cuestionarioService from '../services/cuestionario.service.js';

export const rendir = async (req, res) => {
  res.status(201).json(await cuestionarioService.rendirCuestionario(req.user.id, req.leccion, req.body.respuestas));
};
