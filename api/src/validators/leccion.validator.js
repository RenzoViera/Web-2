import { z } from 'zod';
import { idSchema } from './common.validator.js';

export const TIPOS_LECCION = Object.freeze(['contenido', 'cuestionario']);

/** Tope de negocio (REGLAS B.26): el temario no se pagina. */
export const MAX_LECCIONES_POR_CURSO = 50;

const titulo = z
  .string()
  .trim()
  .min(3, 'El título debe tener al menos 3 caracteres')
  .max(200, 'El título no puede superar los 200 caracteres');

const contenido = z
  .string()
  .trim()
  .max(20000, 'El contenido no puede superar los 20000 caracteres')
  .transform((value) => value || null)
  .nullable()
  .optional();

const videoUrl = z
  .string()
  .trim()
  .max(500, 'La URL del video no puede superar los 500 caracteres')
  .refine((value) => value === '' || URL.canParse(value), 'Ingresa una URL válida')
  .refine((value) => value === '' || /^https?:\/\//i.test(value), 'La URL debe empezar con http:// o https://')
  .transform((value) => value || null)
  .nullable()
  .optional();

const notaMinima = z
  .number({ error: 'Ingresa la nota mínima' })
  .int('La nota mínima debe ser un número entero')
  .min(0, 'La nota mínima no puede ser menor a 0')
  .max(100, 'La nota mínima no puede ser mayor a 100');

export const createLeccionSchema = z.discriminatedUnion(
  'tipo',
  [
    z.object({ tipo: z.literal('contenido'), titulo, contenido, videoUrl }),
    z.object({ tipo: z.literal('cuestionario'), titulo, contenido, notaMinima }),
  ],
  { error: 'El tipo debe ser contenido o cuestionario' },
);

/** El tipo no es editable: cambiarlo rompería preguntas, intentos y progreso ya registrados. */
export const updateLeccionSchema = z
  .object({ titulo: titulo.optional(), contenido, videoUrl, notaMinima: notaMinima.optional() })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: 'Envía al menos un campo para actualizar: titulo, contenido, videoUrl o notaMinima',
  });

export const reordenarLeccionesSchema = z.object({
  ids: z
    .array(idSchema, { error: 'Envía la lista de ids de las lecciones' })
    .min(1, 'Envía al menos una lección')
    .max(MAX_LECCIONES_POR_CURSO, `Un curso no puede tener más de ${MAX_LECCIONES_POR_CURSO} lecciones`)
    .refine((ids) => new Set(ids).size === ids.length, 'La lista tiene lecciones repetidas'),
});
