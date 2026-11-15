import { z } from 'zod';
import { MAX_OPCIONES, MAX_PREGUNTAS_POR_LECCION } from './pregunta.validator.js';

/** Regla de negocio RN-03: intentos por estudiante y cuestionario. */
export const MAX_INTENTOS_CUESTIONARIO = 3;

const respuesta = z.object({
  preguntaId: z
    .number({ error: 'Indica a qué pregunta corresponde cada respuesta' })
    .int('El id de la pregunta debe ser un número entero')
    .positive('El id de la pregunta debe ser un número entero'),
  indice: z
    .number({ error: 'Elige una opción en cada pregunta' })
    .int('La opción elegida debe ser un número entero')
    .min(0, 'La opción elegida no existe')
    .max(MAX_OPCIONES - 1, 'La opción elegida no existe'),
});

/**
 * Forma de las respuestas de un intento. Que estén todas las preguntas del cuestionario (y solo esas) lo verifica
 * el servicio contra la BD.
 */
export const intentoSchema = z.object({
  respuestas: z
    .array(respuesta, { error: 'Envía las respuestas como una lista' })
    .min(1, 'Responde todas las preguntas del cuestionario')
    .max(MAX_PREGUNTAS_POR_LECCION, `Un cuestionario tiene hasta ${MAX_PREGUNTAS_POR_LECCION} preguntas`)
    .refine(
      (respuestas) => new Set(respuestas.map((r) => r.preguntaId)).size === respuestas.length,
      'Cada pregunta se responde una sola vez',
    ),
});
