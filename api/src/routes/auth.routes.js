import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { loginRateLimit } from '../middlewares/rateLimit.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

export const authRoutes = Router();

authRoutes.post('/register', validate({ body: registerSchema }), authController.register);
// El rate limit va antes de validar: un body inválido también cuenta como intento fallido.
authRoutes.post('/login', loginRateLimit, validate({ body: loginSchema }), authController.login);
