import { Router } from 'express';
import * as cursoController from '../controllers/curso.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { isCourseOwner } from '../middlewares/isCourseOwner.js';
import { validate } from '../middlewares/validate.js';
import { ROLES } from '../utils/roles.js';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validator.js';

export const instructorRoutes = Router();

// Todas las rutas de /instructor requieren ser instructor autenticado
instructorRoutes.use(authenticate, authorize(ROLES.INSTRUCTOR));

instructorRoutes.get('/cursos', validate({ query: paginationQuerySchema }), cursoController.listInstructor);
instructorRoutes.get('/cursos/:id', validate({ params: idParamSchema }), isCourseOwner, cursoController.getInstructorCurso);
