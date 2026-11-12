import { Curso, Leccion, Pregunta } from '../models/index.js';

/**
 * Columnas del editor del instructor dueño: incluye `indiceCorrecto` (§6 del plan).
 * Ningún endpoint de estudiante usa este repositorio sin pasar por `toPublicPregunta()`.
 */
export const PREGUNTA_EDITOR_ATTRIBUTES = [
  'id',
  'leccionId',
  'enunciado',
  'opciones',
  'indiceCorrecto',
  'explicacion',
  'createdAt',
  'updatedAt',
];

/** Columnas visibles al estudiante antes/al ver un cuestionario (nunca incluye `indiceCorrecto`, RN-02). */
export const PREGUNTA_PUBLIC_ATTRIBUTES = ['id', 'leccionId', 'enunciado', 'opciones'];

const WRITE_FIELDS = ['leccionId', 'enunciado', 'opciones', 'indiceCorrecto', 'explicacion'];

/**
 * Pregunta con su lección y curso mínimos para validar dueño (una sola consulta).
 * @param {number} id
 * @returns {Promise<Pregunta | null>}
 */
export const findByIdWithCurso = (id) =>
  Pregunta.findByPk(id, {
    attributes: PREGUNTA_EDITOR_ATTRIBUTES,
    include: [
      {
        model: Leccion,
        as: 'leccion',
        attributes: ['id', 'cursoId', 'tipo'],
        include: [{ model: Curso, as: 'curso', attributes: ['id', 'instructorId', 'estado'] }],
      },
    ],
  });

/**
 * @param {number} leccionId
 * @returns {Promise<Pregunta[]>}
 */
export const findPublicByLeccion = (leccionId) =>
  Pregunta.findAll({
    where: { leccionId },
    attributes: PREGUNTA_PUBLIC_ATTRIBUTES,
    order: [['id', 'ASC']],
  });

/**
 * @param {number} leccionId
 * @returns {Promise<number>}
 */
export const countByLeccion = (leccionId) => Pregunta.count({ where: { leccionId } });

/**
 * @param {{ leccionId: number, enunciado: string, opciones: string[], indiceCorrecto: number, explicacion: string | null }} data
 * @returns {Promise<Pregunta>}
 */
export const create = (data) => Pregunta.create(data, { fields: WRITE_FIELDS, returning: PREGUNTA_EDITOR_ATTRIBUTES });

/**
 * @param {number} id
 * @param {{ enunciado: string, opciones: string[], indiceCorrecto: number, explicacion: string | null }} data
 * @returns {Promise<Pregunta | null>}
 */
export const update = async (id, data) => {
  const [, rows] = await Pregunta.update(data, {
    where: { id },
    fields: WRITE_FIELDS.filter((field) => field !== 'leccionId'),
    returning: PREGUNTA_EDITOR_ATTRIBUTES,
  });
  return rows[0] ?? null;
};

/**
 * @param {number} id
 * @returns {Promise<number>}
 */
export const deleteById = (id) => Pregunta.destroy({ where: { id } });
