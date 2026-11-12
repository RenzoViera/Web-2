import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Curso, Leccion } from '../models/index.js';

/** Columnas del editor del instructor (la vista del estudiante usa `LECCION_STUDENT_ATTRIBUTES`). */
export const LECCION_ATTRIBUTES = [
  'id',
  'cursoId',
  'titulo',
  'contenido',
  'videoUrl',
  'tipo',
  'orden',
  'notaMinima',
  'createdAt',
  'updatedAt',
];

export const LECCION_STUDENT_ATTRIBUTES = [
  'id',
  'cursoId',
  'titulo',
  'contenido',
  'videoUrl',
  'tipo',
  'orden',
  'notaMinima',
];

export const LECCION_RESUMEN_ATTRIBUTES = ['id', 'cursoId', 'titulo', 'tipo', 'orden', 'notaMinima'];

const CREATE_FIELDS = ['cursoId', 'titulo', 'contenido', 'videoUrl', 'tipo', 'orden', 'notaMinima'];
const UPDATE_FIELDS = ['titulo', 'contenido', 'videoUrl', 'notaMinima'];

/**
 * @typedef {{ transaction?: import('sequelize').Transaction }} TxOptions
 */

/**
 * Lección con el curso padre mínimo para validar dueño (una sola consulta).
 * @param {number} id
 * @returns {Promise<Leccion | null>}
 */
export const findByIdWithCurso = (id) =>
  Leccion.findByPk(id, {
    attributes: LECCION_ATTRIBUTES,
    include: [{ model: Curso, as: 'curso', attributes: ['id', 'instructorId', 'estado'] }],
  });

/**
 * Lección con el curso mínimo para la vista del estudiante (sin `createdAt`/`updatedAt`).
 * @param {number} id
 * @returns {Promise<Leccion | null>}
 */
export const findByIdForStudent = (id) =>
  Leccion.findByPk(id, {
    attributes: LECCION_STUDENT_ATTRIBUTES,
    include: [{ model: Curso, as: 'curso', attributes: ['id', 'titulo', 'estado'] }],
  });

/**
 * Temario resumido de un curso para calcular avance secuencial (sin `contenido` ni `videoUrl`).
 * @param {number} cursoId
 * @param {TxOptions} [options]
 * @returns {Promise<Leccion[]>}
 */
export const findResumenByCurso = (cursoId, { transaction } = {}) =>
  Leccion.findAll({
    where: { cursoId },
    attributes: LECCION_RESUMEN_ATTRIBUTES,
    order: [
      ['orden', 'ASC'],
      ['id', 'ASC'],
    ],
    transaction,
  });

/**
 * Lecciones de un curso ordenadas (sin preguntas). Acotadas por MAX_LECCIONES_POR_CURSO.
 * @param {number} cursoId
 * @param {TxOptions} [options]
 * @returns {Promise<Leccion[]>}
 */
export const findByCurso = (cursoId, { transaction } = {}) =>
  Leccion.findAll({
    where: { cursoId },
    attributes: LECCION_ATTRIBUTES,
    order: [
      ['orden', 'ASC'],
      ['id', 'ASC'],
    ],
    transaction,
  });

/**
 * Ids de las lecciones de un curso.
 * @param {number} cursoId
 * @param {TxOptions} [options]
 * @returns {Promise<number[]>}
 */
export const findIdsByCurso = async (cursoId, { transaction } = {}) => {
  const rows = await Leccion.findAll({ where: { cursoId }, attributes: ['id'], raw: true, transaction });
  return rows.map((row) => row.id);
};

/**
 * Cantidad de lecciones, mayor `orden` y cuestionarios sin preguntas de un curso (una sola consulta).
 * @param {number} cursoId
 * @param {TxOptions} [options]
 * @returns {Promise<{ total: number, maxOrden: number, cuestionariosSinPreguntas: number }>}
 */
export const getStatsByCurso = async (cursoId, { transaction } = {}) => {
  const [stats] = await sequelize.query(
    `SELECT COUNT(*)::int AS "total",
            COALESCE(MAX(l.orden), 0)::int AS "maxOrden",
            (COUNT(*) FILTER (
              WHERE l.tipo = 'cuestionario'
                AND NOT EXISTS (SELECT 1 FROM preguntas p WHERE p."leccionId" = l.id)
            ))::int AS "cuestionariosSinPreguntas"
       FROM lecciones l
      WHERE l."cursoId" = :cursoId`,
    { replacements: { cursoId }, type: QueryTypes.SELECT, transaction },
  );
  return /** @type {{ total: number, maxOrden: number, cuestionariosSinPreguntas: number }} */ (stats);
};

/**
 * @param {{ cursoId: number, titulo: string, contenido: string | null, videoUrl: string | null, tipo: string, orden: number, notaMinima: number | null }} data
 * @param {TxOptions} [options]
 * @returns {Promise<Leccion>}
 */
export const create = (data, { transaction } = {}) =>
  Leccion.create(data, { fields: CREATE_FIELDS, returning: LECCION_ATTRIBUTES, transaction });

/**
 * @param {number} id
 * @param {object} changes
 * @returns {Promise<Leccion | null>}
 */
export const update = async (id, changes) => {
  const [, rows] = await Leccion.update(changes, {
    where: { id },
    fields: UPDATE_FIELDS,
    returning: LECCION_ATTRIBUTES,
  });
  return rows[0] ?? null;
};

/**
 * Borra la lección (sus preguntas, progresos e intentos caen por ON DELETE CASCADE).
 * @param {number} id
 * @param {TxOptions} [options]
 * @returns {Promise<number>}
 */
export const deleteById = (id, { transaction } = {}) => Leccion.destroy({ where: { id }, transaction });

/**
 * Renumera `orden` a 1..n respetando el orden actual (un solo UPDATE; solo toca las filas que cambian).
 * @param {number} cursoId
 * @param {TxOptions} [options]
 */
export const compactOrden = (cursoId, { transaction } = {}) =>
  sequelize.query(
    `UPDATE lecciones AS l
        SET orden = s.posicion, "updatedAt" = NOW()
       FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY orden, id) AS posicion
               FROM lecciones
              WHERE "cursoId" = :cursoId) AS s
      WHERE l.id = s.id AND l.orden <> s.posicion`,
    { replacements: { cursoId }, transaction },
  );

/**
 * Asigna `orden` = posición en `ids` (1..n) en un solo UPDATE.
 * @param {number} cursoId
 * @param {number[]} ids Todas las lecciones del curso, en el orden nuevo.
 * @param {TxOptions} [options]
 */
export const reorder = (cursoId, ids, { transaction } = {}) =>
  sequelize.query(
    `UPDATE lecciones AS l
        SET orden = v.posicion, "updatedAt" = NOW()
       FROM unnest(ARRAY[:ids]::int[]) WITH ORDINALITY AS v(id, posicion)
      WHERE l.id = v.id AND l."cursoId" = :cursoId AND l.orden <> v.posicion`,
    { replacements: { cursoId, ids }, transaction },
  );
