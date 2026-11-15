import { z } from 'zod';
import { paginationQuerySchema } from './common.validator.js';

/**
 * Esquema de consulta para listar estudiantes inscritos en un curso del instructor.
 */
export const cursoEstudiantesQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).optional(),
  completado: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});
