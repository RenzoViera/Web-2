import { fn, col } from 'sequelize';
import { IntentoCuestionario } from '../models/index.js';

/** `respuestas` se guarda para auditoría pero nunca se devuelve. */
export const INTENTO_ATTRIBUTES = ['id', 'usuarioId', 'leccionId', 'puntaje', 'aprobado', 'numeroIntento', 'createdAt'];

const CREATE_FIELDS = ['usuarioId', 'leccionId', 'puntaje', 'aprobado', 'respuestas', 'numeroIntento'];

/**
 * Intentos realizados y mejor nota de un estudiante en un cuestionario: `COUNT` y `MAX` en una sola consulta
 * (índice `(usuarioId, leccionId)`).
 * @param {number} usuarioId
 * @param {number} leccionId
 * @param {{ transaction?: import('sequelize').Transaction }} [options]
 * @returns {Promise<{ realizados: number, mejorNota: number | null }>}
 */
export const getResumenByUsuarioAndLeccion = async (usuarioId, leccionId, { transaction } = {}) => {
  const [row] = await IntentoCuestionario.findAll({
    where: { usuarioId, leccionId },
    attributes: [
      [fn('COUNT', col('id')), 'realizados'],
      [fn('MAX', col('puntaje')), 'mejorNota'],
    ],
    raw: true,
    transaction,
  });
  // `COUNT` llega como texto (bigint de Postgres).
  return { realizados: Number(row?.realizados ?? 0), mejorNota: row?.mejorNota ?? null };
};

/**
 * @param {{ usuarioId: number, leccionId: number, puntaje: number, aprobado: boolean, respuestas: Array<{ preguntaId: number, indice: number }>, numeroIntento: number }} data
 * @param {{ transaction?: import('sequelize').Transaction }} [options]
 * @returns {Promise<IntentoCuestionario>}
 */
export const create = (data, { transaction } = {}) =>
  IntentoCuestionario.create(data, { fields: CREATE_FIELDS, returning: INTENTO_ATTRIBUTES, transaction });
