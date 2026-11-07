import { z } from 'zod';
import { ROLE_VALUES } from '../utils/roles.js';

// bcrypt solo usa los primeros 72 bytes: más largo no suma seguridad y permitiría contraseñas "distintas" equivalentes.
const PASSWORD_MAX = 72;

const nombre = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'El nombre no puede superar los 100 caracteres');

// Se recorta y pasa a minúsculas antes de validar: el UNIQUE de la BD distingue mayúsculas.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(255, 'El email no puede superar los 255 caracteres')
  .pipe(z.email('Ingresa un email válido'));

const nuevaPassword = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(PASSWORD_MAX, `La contraseña no puede superar los ${PASSWORD_MAX} caracteres`);

const rol = z.enum(ROLE_VALUES, { error: 'Elige un rol válido: estudiante o instructor' });

export const registerSchema = z.object({ nombre, email, password: nuevaPassword, rol });

// En el login no se exigen las reglas de la contraseña: solo se compara.
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

// `rol` no es editable: z.object descarta las claves desconocidas.
export const updateMeSchema = z
  .object({
    nombre: nombre.optional(),
    email: email.optional(),
    password: nuevaPassword.optional(),
    passwordActual: z.string().min(1, 'Ingresa tu contraseña actual').optional(),
  })
  .refine((data) => data.nombre !== undefined || data.email !== undefined || data.password !== undefined, {
    error: 'Envía al menos un campo para actualizar: nombre, email o password',
  })
  .refine((data) => data.password === undefined || data.passwordActual !== undefined, {
    path: ['passwordActual'],
    error: 'Ingresa tu contraseña actual para cambiarla',
  });

// Payload que firma auth.service: se valida al verificar el token (defensa ante tokens con otra forma).
export const tokenPayloadSchema = z.object({
  id: z.number().int().positive(),
  rol: z.enum(ROLE_VALUES),
});
