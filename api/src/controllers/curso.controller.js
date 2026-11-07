import * as cursoService from '../services/curso.service.js';

export const create = async (req, res) => {
  res.status(201).json(await cursoService.crearCurso(req.user.id, req.body));
};

export const update = async (req, res) => {
  res.json(await cursoService.actualizarCurso(req.curso.id, req.body));
};

export const remove = async (req, res) => {
  await cursoService.eliminarCurso(req.curso.id);
  res.status(204).end();
};

export const changeEstado = async (req, res) => {
  res.json(await cursoService.cambiarEstado(req.curso.id, req.body.estado));
};

export const listPublic = async (req, res) => {
  res.json(await cursoService.obtenerCatalogo(req.query));
};

export const getPublic = async (req, res) => {
  res.json(await cursoService.obtenerDetallePublico(Number(req.params.id)));
};

export const listInstructor = async (req, res) => {
  res.json(await cursoService.obtenerCursosInstructor(req.user.id, req.query));
};

export const getInstructorCurso = async (req, res) => {
  res.json(await cursoService.obtenerCursoInstructorDetalle(req.curso.id));
};
