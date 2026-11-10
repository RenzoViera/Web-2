import { Router } from 'express';
import * as inscripcionController from '../controllers/inscripcion.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { ROLES } from '../utils/roles.js';
import { paginationQuerySchema } from '../validators/common.validator.js';

export const inscripcionRoutes = Router();

inscripcionRoutes.get(
  '/mias',
  authenticate,
  authorize(ROLES.ESTUDIANTE),
  validate({ query: paginationQuerySchema }),
  inscripcionController.listMias,
);
