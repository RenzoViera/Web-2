import { z } from 'zod';
import { paginationQuerySchema } from './common.validator.js';

export const NIVELES_CURSO = Object.freeze(['principiante', 'intermedio', 'avanzado']);
export const ESTADOS_CURSO = Object.freeze(['borrador', 'publicado', 'archivado']);

const titulo = z
  .string()
  .trim()
  .min(3, 'El título debe tener al menos 3 caracteres')
  .max(200, 'El título no puede superar los 200 caracteres');

const descripcion = z
  .string()
  .trim()
  .max(5000, 'La descripción no puede superar los 5000 caracteres')
  .nullable()
  .optional();

const categoria = z
  .string()
  .trim()
  .min(2, 'La categoría debe tener al menos 2 caracteres')
  .max(100, 'La categoría no puede superar los 100 caracteres');

const nivel = z.enum(NIVELES_CURSO, {
  error: 'Elige un nivel válido: principiante, intermedio o avanzado',
});

const imagenUrl = z
  .string()
  .trim()
  .url('Ingresa una URL válida de imagen')
  .max(500, 'La URL de la imagen no puede superar los 500 caracteres')
  .nullable()
  .optional()
  .or(z.literal(''));

export const createCursoSchema = z.object({
  titulo,
  descripcion,
  categoria,
  nivel,
  imagenUrl,
});

export const updateCursoSchema = z
  .object({
    titulo: titulo.optional(),
    descripcion: descripcion,
    categoria: categoria.optional(),
    nivel: nivel.optional(),
    imagenUrl: imagenUrl,
  })
  .refine(
    (data) =>
      data.titulo !== undefined ||
      data.descripcion !== undefined ||
      data.categoria !== undefined ||
      data.nivel !== undefined ||
      data.imagenUrl !== undefined,
    {
      error: 'Envía al menos un campo para actualizar: titulo, descripcion, categoria, nivel o imagenUrl',
    },
  );

export const changeEstadoSchema = z.object({
  estado: z.enum(['publicado', 'archivado', 'borrador'], {
    error: 'El estado debe ser borrador, publicado o archivado',
  }),
});

export const catalogoQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().optional(),
  categoria: z.string().trim().optional(),
  nivel: z.enum(NIVELES_CURSO).optional(),
});
