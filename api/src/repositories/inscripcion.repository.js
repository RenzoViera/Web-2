import { sequelize } from '../config/database.js';
import { Curso, Inscripcion, Usuario } from '../models/index.js';

const INSCRIPCION_ATTRIBUTES = ['id', 'usuarioId', 'cursoId', 'completado', 'createdAt'];

const CURSO_RESUMEN_ATTRIBUTES = ['id', 'titulo', 'categoria', 'nivel', 'estado', 'imagenUrl'];

/*
 * Conteos y siguiente lección por subconsulta correlacionada (una sola consulta para toda la página, sin N+1).
 * Usan los índices `lecciones(cursoId, orden)` y `progresos_lecciones(usuarioId, leccionId)`.
 */
const TOTAL_LECCIONES = [
  sequelize.literal('(SELECT COUNT(*)::int FROM lecciones l WHERE l."cursoId" = "Inscripcion"."cursoId")'),
  'totalLecciones',
];

const LECCIONES_COMPLETADAS = [
  sequelize.literal(`(SELECT COUNT(*)::int
       FROM progresos_lecciones p
       JOIN lecciones l ON l.id = p."leccionId"
      WHERE p."usuarioId" = "Inscripcion"."usuarioId"
        AND l."cursoId" = "Inscripcion"."cursoId"
        AND p.completada)`),
  'leccionesCompletadas',
];

// Primera lección sin completar por `orden` (o la primera si ya completó todas); NULL si el curso no tiene lecciones.
const SIGUIENTE_LECCION = [
  sequelize.literal(`(SELECT l.id
       FROM lecciones l
       LEFT JOIN progresos_lecciones p
         ON p."leccionId" = l.id AND p."usuarioId" = "Inscripcion"."usuarioId" AND p.completada
      WHERE l."cursoId" = "Inscripcion"."cursoId"
      ORDER BY (p.id IS NOT NULL), l.orden
      LIMIT 1)`),
  'siguienteLeccionId',
];

/**
 * Inscribe al estudiante. El índice UNIQUE (usuarioId, cursoId) rechaza la doble inscripción (RN-04).
 * @param {{ usuarioId: number, cursoId: number }} data
 * @returns {Promise<Inscripcion>}
 */
export const create = ({ usuarioId, cursoId }) =>
  Inscripcion.create({ usuarioId, cursoId }, { fields: ['usuarioId', 'cursoId'], returning: INSCRIPCION_ATTRIBUTES });

/**
 * Inscripciones de un estudiante (más recientes primero) con el curso, su instructor, conteos de avance y la
 * siguiente lección.
 * @param {number} usuarioId
 * @param {{ limit: number, offset: number }} pagination
 * @returns {Promise<{ rows: Inscripcion[], count: number }>}
 */
export const findByUsuario = (usuarioId, { limit, offset }) =>
  Inscripcion.findAndCountAll({
    where: { usuarioId },
    attributes: [...INSCRIPCION_ATTRIBUTES, TOTAL_LECCIONES, LECCIONES_COMPLETADAS, SIGUIENTE_LECCION],
    include: [
      {
        model: Curso,
        as: 'curso',
        attributes: CURSO_RESUMEN_ATTRIBUTES,
        include: [{ model: Usuario, as: 'instructor', attributes: ['id', 'nombre'] }],
      },
    ],
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit,
    offset,
  });

/**
 * Inscripción puntual de un estudiante en un curso.
 * @param {number} usuarioId
 * @param {number} cursoId
 * @param {{ transaction?: import('sequelize').Transaction }} [options]
 * @returns {Promise<Inscripcion | null>}
 */
export const findByUsuarioAndCurso = (usuarioId, cursoId, { transaction } = {}) =>
  Inscripcion.findOne({
    where: { usuarioId, cursoId },
    attributes: INSCRIPCION_ATTRIBUTES,
    transaction,
  });

/**
 * Toma `SELECT ... FOR UPDATE` sobre la inscripción para serializar completados concurrentes del curso.
 * @param {number} usuarioId
 * @param {number} cursoId
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<Inscripcion | null>}
 */
export const lockByUsuarioAndCurso = (usuarioId, cursoId, transaction) =>
  Inscripcion.findOne({
    where: { usuarioId, cursoId },
    attributes: INSCRIPCION_ATTRIBUTES,
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

/**
 * Actualiza `completado` en la inscripción.
 * @param {number} id
 * @param {boolean} completado
 * @param {{ transaction?: import('sequelize').Transaction }} [options]
 * @returns {Promise<Inscripcion | null>}
 */
export const updateCompletado = async (id, completado, { transaction } = {}) => {
  const [, rows] = await Inscripcion.update(
    { completado },
    { where: { id }, fields: ['completado'], returning: INSCRIPCION_ATTRIBUTES, transaction },
  );
  return rows[0] ?? null;
};
