import { ProgresoLeccion } from '../models/index.js';

export const PROGRESO_ATTRIBUTES = [
  'id',
  'usuarioId',
  'leccionId',
  'completada',
  'fechaCompletada',
  'createdAt',
  'updatedAt',
];

const CREATE_FIELDS = ['usuarioId', 'leccionId', 'completada', 'fechaCompletada'];
const UPDATE_FIELDS = ['completada', 'fechaCompletada'];

/**
 * Progresos del estudiante para un conjunto de lecciones (consulta por lote, sin N+1).
 * @param {number} usuarioId
 * @param {number[]} leccionIds
 * @param {{ transaction?: import('sequelize').Transaction }} [options]
 * @returns {Promise<ProgresoLeccion[]>}
 */
export const findByUsuarioAndLecciones = (usuarioId, leccionIds, { transaction } = {}) => {
  if (leccionIds.length === 0) return Promise.resolve([]);
  return ProgresoLeccion.findAll({
    where: { usuarioId, leccionId: leccionIds },
    attributes: PROGRESO_ATTRIBUTES,
    transaction,
  });
};

/**
 * @param {number} usuarioId
 * @param {number} leccionId
 * @param {{ transaction?: import('sequelize').Transaction }} [options]
 * @returns {Promise<ProgresoLeccion | null>}
 */
export const findByUsuarioAndLeccion = (usuarioId, leccionId, { transaction } = {}) =>
  ProgresoLeccion.findOne({
    where: { usuarioId, leccionId },
    attributes: PROGRESO_ATTRIBUTES,
    transaction,
  });

/**
 * Marca una lección como completada de forma idempotente (conserva `fechaCompletada` si ya lo estaba).
 * @param {number} usuarioId
 * @param {number} leccionId
 * @param {Date} fechaCompletada
 * @param {{ transaction?: import('sequelize').Transaction }} [options]
 * @returns {Promise<ProgresoLeccion>}
 */
export const markCompletada = async (usuarioId, leccionId, fechaCompletada, { transaction } = {}) => {
  const existing = await findByUsuarioAndLeccion(usuarioId, leccionId, { transaction });
  if (existing?.completada) return existing;

  if (existing) {
    const [, rows] = await ProgresoLeccion.update(
      { completada: true, fechaCompletada },
      { where: { id: existing.id }, fields: UPDATE_FIELDS, returning: PROGRESO_ATTRIBUTES, transaction },
    );
    return rows[0];
  }

  return ProgresoLeccion.create(
    { usuarioId, leccionId, completada: true, fechaCompletada },
    { fields: CREATE_FIELDS, returning: PROGRESO_ATTRIBUTES, transaction },
  );
};
