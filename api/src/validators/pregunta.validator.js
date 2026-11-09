import { z } from 'zod';

/** Tope de negocio (REGLAS B.26): las preguntas de un cuestionario no se paginan. */
export const MAX_PREGUNTAS_POR_LECCION = 30;
export const MIN_OPCIONES = 2;
export const MAX_OPCIONES = 6;

const opcion = z
  .string({ error: 'Cada opción debe ser un texto' })
  .trim()
  .min(1, 'Las opciones no pueden estar vacías')
  .max(300, 'Cada opción puede tener hasta 300 caracteres');

/** PUT reemplaza la pregunta completa: mismo esquema para crear y editar. */
export const preguntaSchema = z
  .object({
    enunciado: z
      .string({ error: 'Ingresa el enunciado' })
      .trim()
      .min(3, 'El enunciado debe tener al menos 3 caracteres')
      .max(1000, 'El enunciado no puede superar los 1000 caracteres'),
    opciones: z
      .array(opcion, { error: 'Envía las opciones como una lista' })
      .min(MIN_OPCIONES, `Agrega al menos ${MIN_OPCIONES} opciones`)
      .max(MAX_OPCIONES, `Puedes agregar hasta ${MAX_OPCIONES} opciones`)
      .refine(
        (opciones) => new Set(opciones.map((texto) => texto.toLowerCase())).size === opciones.length,
        'Las opciones no pueden repetirse',
      ),
    indiceCorrecto: z
      .number({ error: 'Marca cuál es la opción correcta' })
      .int('Marca cuál es la opción correcta')
      .min(0, 'Marca cuál es la opción correcta'),
    explicacion: z
      .string()
      .trim()
      .max(2000, 'La explicación no puede superar los 2000 caracteres')
      .transform((value) => value || null)
      .nullable()
      .optional(),
  })
  .refine((data) => data.indiceCorrecto < data.opciones.length, {
    path: ['indiceCorrecto'],
    error: 'La opción correcta debe ser una de las opciones',
  });
