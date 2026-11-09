import { Router } from 'express';
import * as preguntaController from '../controllers/pregunta.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { isPreguntaOwner } from '../middlewares/isCourseOwner.js';
import { validate } from '../middlewares/validate.js';
import { ROLES } from '../utils/roles.js';
import { idParamSchema } from '../validators/common.validator.js';
import { preguntaSchema } from '../validators/pregunta.validator.js';

export const preguntaRoutes = Router();

const instructorDueno = [authenticate, authorize(ROLES.INSTRUCTOR), validate({ params: idParamSchema }), isPreguntaOwner];

preguntaRoutes.put('/:id', ...instructorDueno, validate({ body: preguntaSchema }), preguntaController.update);
preguntaRoutes.delete('/:id', ...instructorDueno, preguntaController.remove);
