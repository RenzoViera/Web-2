import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { Curso, Inscripcion, Leccion, Pregunta, Usuario } from '../models/index.js';
import { LECCION_ATTRIBUTES } from './leccion.repository.js';
import { PREGUNTA_EDITOR_ATTRIBUTES } from './pregunta.repository.js';

const CURSO_PUBLIC_ATTRIBUTES = [
  'id',
  'instructorId',
  'titulo',
  'descripcion',
  'categoria',
  'nivel',
  'estado',
  'imagenUrl',
  'createdAt',
  'updatedAt',
];

const CREATE_FIELDS = [
  'instructorId',
  'titulo',
  'descripcion',
  'categoria',
  'nivel',
  'estado',
  'imagenUrl',
];

const UPDATE_FIELDS = [
  'titulo',
  'descripcion',
  'categoria',
  'nivel',
  'imagenUrl',
];

const LECCIONES_COUNT_LITERAL = [
  sequelize.literal('(SELECT COUNT(*)::int FROM lecciones WHERE lecciones."cursoId" = "Curso"."id")'),
  'totalLecciones',
];

const INSCRITOS_COUNT_LITERAL = [
  sequelize.literal('(SELECT COUNT(*)::int FROM inscripciones WHERE inscripciones."cursoId" = "Curso"."id")'),
  'totalInscritos',
];

/** Escapa los comodines de LIKE (`%`, `_` y la barra invertida) para buscar el texto tal cual lo escribió el usuario. */
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

/**
 * @param {number} id
 * @returns {Promise<Curso | null>}
 */
export const findById = (id) => Curso.findByPk(id, { attributes: CURSO_PUBLIC_ATTRIBUTES });

/**
 * Solo id y estado (p. ej. para validar que acepta inscripciones).
 * @param {number} id
 * @returns {Promise<Curso | null>}
 */
export const findEstadoById = (id) => Curso.findByPk(id, { attributes: ['id', 'estado'] });

/**
 * @param {{ instructorId: number, titulo: string, descripcion?: string | null, categoria: string, nivel: string, estado: string, imagenUrl?: string | null }} data
 * @returns {Promise<Curso>}
 */
export const create = (data) =>
  Curso.create(data, {
    fields: CREATE_FIELDS,
    returning: CURSO_PUBLIC_ATTRIBUTES,
  });

/**
 * @param {number} id
 * @param {object} changes
 * @returns {Promise<Curso | null>}
 */
export const update = async (id, changes) => {
  const [, rows] = await Curso.update(changes, {
    where: { id },
    fields: UPDATE_FIELDS,
    returning: CURSO_PUBLIC_ATTRIBUTES,
  });
  return rows[0] ?? null;
};

/**
 * @param {number} id
 * @param {'borrador' | 'publicado' | 'archivado'} estado
 * @returns {Promise<Curso | null>}
 */
export const updateEstado = async (id, estado) => {
  const [, rows] = await Curso.update(
    { estado },
    {
      where: { id },
      fields: ['estado'],
      returning: CURSO_PUBLIC_ATTRIBUTES,
    },
  );
  return rows[0] ?? null;
};

/**
 * @param {number} id
 * @returns {Promise<number>}
 */
export const deleteById = (id) => Curso.destroy({ where: { id } });

/**
 * @param {number} cursoId
 * @param {{ transaction?: import('sequelize').Transaction }} [options]
 * @returns {Promise<number>}
 */
export const countInscripciones = (cursoId, { transaction } = {}) =>
  Inscripcion.count({ where: { cursoId }, transaction });

/**
 * Bloquea la fila del curso (`SELECT ... FOR UPDATE`) hasta el fin de la transacción: serializa las operaciones
 * que recalculan el `orden` de sus lecciones (crear, borrar, reordenar).
 * @param {number} id
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<Curso | null>}
 */
export const lockById = (id, transaction) =>
  Curso.findByPk(id, { attributes: ['id'], lock: transaction.LOCK.UPDATE, transaction });

/**
 * Cursos del instructor con conteos de lecciones e inscritos.
 * @param {number} instructorId
 * @param {{ limit: number, offset: number }} pagination
 * @returns {Promise<{ rows: Curso[], count: number }>}
 */
export const findInstructorCursos = (instructorId, { limit, offset }) =>
  Curso.findAndCountAll({
    where: { instructorId },
    attributes: [...CURSO_PUBLIC_ATTRIBUTES, LECCIONES_COUNT_LITERAL, INSCRITOS_COUNT_LITERAL],
    order: [['updatedAt', 'DESC']],
    limit,
    offset,
  });

/**
 * Curso del instructor con sus lecciones y preguntas (con indiceCorrecto para el editor).
 * @param {number} id
 * @returns {Promise<Curso | null>}
 */
export const findInstructorCursoById = (id) =>
  Curso.findByPk(id, {
    attributes: CURSO_PUBLIC_ATTRIBUTES,
    include: [
      {
        model: Leccion,
        as: 'lecciones',
        attributes: LECCION_ATTRIBUTES,
        separate: true,
        order: [['orden', 'ASC']],
        include: [
          {
            model: Pregunta,
            as: 'preguntas',
            attributes: PREGUNTA_EDITOR_ATTRIBUTES,
            separate: true,
            order: [['id', 'ASC']],
          },
        ],
      },
    ],
  });

/**
 * Catálogo público: solo publicados, búsqueda por título (Op.iLike) y filtros opcionales.
 * @param {{ q?: string, categoria?: string, nivel?: string }} filters
 * @param {{ limit: number, offset: number }} pagination
 * @returns {Promise<{ rows: Curso[], count: number }>}
 */
export const findPublicados = ({ q, categoria, nivel }, { limit, offset }) => {
  /** @type {import('sequelize').WhereOptions} */
  const where = { estado: 'publicado' };

  if (q) {
    where.titulo = { [Op.iLike]: `%${escapeLike(q)}%` };
  }
  if (categoria) {
    where.categoria = categoria;
  }
  if (nivel) {
    where.nivel = nivel;
  }

  return Curso.findAndCountAll({
    where,
    attributes: [...CURSO_PUBLIC_ATTRIBUTES, LECCIONES_COUNT_LITERAL],
    include: [
      {
        model: Usuario,
        as: 'instructor',
        attributes: ['id', 'nombre'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true,
  });
};

/**
 * `inscrito` en la misma consulta del detalle: EXISTS para un estudiante, NULL para visitantes e instructores.
 * @param {number | null} estudianteId
 */
const inscritoAttribute = (estudianteId) => [
  estudianteId === null
    ? sequelize.literal('NULL')
    : sequelize.literal(
        `EXISTS (SELECT 1 FROM inscripciones i
                  WHERE i."cursoId" = "Curso"."id" AND i."usuarioId" = ${sequelize.escape(estudianteId)})`,
      ),
  'inscrito',
];

/**
 * Detalle público del curso (solo si publicado): temario resumido (sin contenido, videoUrl ni preguntas) e
 * `inscrito` del estudiante que consulta.
 * @param {number} id
 * @param {{ estudianteId?: number | null }} [options]
 * @returns {Promise<Curso | null>}
 */
export const findPublicadoById = (id, { estudianteId = null } = {}) =>
  Curso.findOne({
    where: { id, estado: 'publicado' },
    attributes: [...CURSO_PUBLIC_ATTRIBUTES, inscritoAttribute(estudianteId)],
    include: [
      {
        model: Usuario,
        as: 'instructor',
        attributes: ['id', 'nombre'],
      },
      {
        model: Leccion,
        as: 'lecciones',
        attributes: ['id', 'titulo', 'tipo', 'orden'],
        separate: true,
        order: [['orden', 'ASC']],
      },
    ],
  });

/**
 * Categorías distintas de los cursos publicados, en orden alfabético (chips del catálogo).
 * @param {number} limit Tope duro (el servicio pide uno más para saber si se truncó).
 * @returns {Promise<string[]>}
 */
export const findCategoriasPublicadas = async (limit) => {
  const rows = await Curso.findAll({
    where: { estado: 'publicado' },
    attributes: ['categoria'],
    group: ['categoria'],
    order: [['categoria', 'ASC']],
    limit,
    raw: true,
  });
  return rows.map((row) => row.categoria);
};
