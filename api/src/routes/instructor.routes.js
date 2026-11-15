import { Router } from 'express';
import * as cursoController from '../controllers/curso.controller.js';
import * as instructorController from '../controllers/instructor.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { isCourseOwner } from '../middlewares/isCourseOwner.js';
import { validate } from '../middlewares/validate.js';
import { ROLES } from '../utils/roles.js';
import { idParamSchema, paginationQuerySchema } from '../validators/common.validator.js';
import { cursoEstudiantesQuerySchema } from '../validators/instructor.validator.js';

export const instructorRoutes = Router();

// Todas las rutas de /instructor requieren ser instructor autenticado
instructorRoutes.use(authenticate, authorize(ROLES.INSTRUCTOR));

// Resumen global del panel de métricas del instructor
instructorRoutes.get('/resumen', instructorController.getResumen);

// Listado de cursos del instructor
instructorRoutes.get('/cursos', validate({ query: paginationQuerySchema }), cursoController.listInstructor);

// Detalle del curso para el editor (con respuestas correctas para edición)
instructorRoutes.get('/cursos/:id', validate({ params: idParamSchema }), isCourseOwner, cursoController.getInstructorCurso);

// Panel de métricas y avance por lección de un curso específico
instructorRoutes.get(
  '/cursos/:id/resumen',
  validate({ params: idParamSchema }),
  isCourseOwner,
  instructorController.getCursoResumen,
);

// Listado paginado de estudiantes de un curso con su avance
instructorRoutes.get(
  '/cursos/:id/estudiantes',
  validate({ params: idParamSchema, query: cursoEstudiantesQuerySchema }),
  isCourseOwner,
  instructorController.getCursoEstudiantes,
);
