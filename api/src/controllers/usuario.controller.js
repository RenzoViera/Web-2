import * as usuarioService from '../services/usuario.service.js';

export const getMe = async (req, res) => {
  res.json(await usuarioService.getProfile(req.user.id));
};

export const updateMe = async (req, res) => {
  res.json(await usuarioService.updateProfile(req.user.id, req.body));
};
