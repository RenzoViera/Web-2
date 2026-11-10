import { Router } from 'express';
import * as cursoController from '../controllers/curso.controller.js';
import * as inscripcionController from '../controllers/inscripcion.controller.js';
import * as leccionController from '../controllers/leccion.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { isCourseOwner } from '../middlewares/isCourseOwner.js';
import { validate } from '../middlewares/validate.js';
import { ROLES } from '../utils/roles.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  catalogoQuerySchema,
  changeEstadoSchema,
  createCursoSchema,
  updateCursoSchema,
} from '../validators/curso.validator.js';
import { createLeccionSchema, reordenarLeccionesSchema } from '../validators/leccion.validator.js';

export const cursoRoutes = Router();

// Catálogo público
cursoRoutes.get('/', validate({ query: catalogoQuerySchema }), cursoController.listPublic);
cursoRoutes.get('/:id', validate({ params: idParamSchema }), cursoController.getPublic);

// Inscripción del estudiante (paso 06)
cursoRoutes.post(
  '/:id/inscripcion',
  authenticate,
  authorize(ROLES.ESTUDIANTE),
  validate({ params: idParamSchema }),
  inscripcionController.create,
);

// Administración por instructor
cursoRoutes.post(
  '/',
  authenticate,
  authorize(ROLES.INSTRUCTOR),
  validate({ body: createCursoSchema }),
  cursoController.create,
);

cursoRoutes.put(
  '/:id',
  authenticate,
  authorize(ROLES.INSTRUCTOR),
  validate({ params: idParamSchema }),
  isCourseOwner,
  validate({ body: updateCursoSchema }),
  cursoController.update,
);

cursoRoutes.delete(
  '/:id',
  authenticate,
  authorize(ROLES.INSTRUCTOR),
  validate({ params: idParamSchema }),
  isCourseOwner,
  cursoController.remove,
);

cursoRoutes.patch(
  '/:id/estado',
  authenticate,
  authorize(ROLES.INSTRUCTOR),
  validate({ params: idParamSchema }),
  isCourseOwner,
  validate({ body: changeEstadoSchema }),
  cursoController.changeEstado,
);

// Lecciones del curso (paso 05)
cursoRoutes.post(
  '/:id/lecciones',
  authenticate,
  authorize(ROLES.INSTRUCTOR),
  validate({ params: idParamSchema }),
  isCourseOwner,
  validate({ body: createLeccionSchema }),
  leccionController.create,
);

cursoRoutes.patch(
  '/:id/lecciones/orden',
  authenticate,
  authorize(ROLES.INSTRUCTOR),
  validate({ params: idParamSchema }),
  isCourseOwner,
  validate({ body: reordenarLeccionesSchema }),
  leccionController.reorder,
);
