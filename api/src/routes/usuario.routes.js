import { Router } from 'express';
import * as usuarioController from '../controllers/usuario.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { updateMeSchema } from '../validators/auth.validator.js';

export const usuarioRoutes = Router();

usuarioRoutes.get('/me', authenticate, usuarioController.getMe);
usuarioRoutes.put('/me', authenticate, validate({ body: updateMeSchema }), usuarioController.updateMe);
