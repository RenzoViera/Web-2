import { Router } from 'express';
import * as cursoController from '../controllers/curso.controller.js';
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

export const cursoRoutes = Router();

// Catálogo público
cursoRoutes.get('/', validate({ query: catalogoQuerySchema }), cursoController.listPublic);
cursoRoutes.get('/:id', validate({ params: idParamSchema }), cursoController.getPublic);

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
