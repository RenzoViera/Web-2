import { Router } from 'express';
import * as leccionController from '../controllers/leccion.controller.js';
import * as preguntaController from '../controllers/pregunta.controller.js';
import * as progresoController from '../controllers/progreso.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { isLeccionOwner } from '../middlewares/isCourseOwner.js';
import { isLeccionEnrolled } from '../middlewares/isEnrolled.js';
import { validate } from '../middlewares/validate.js';
import { ROLES } from '../utils/roles.js';
import { idParamSchema } from '../validators/common.validator.js';
import { updateLeccionSchema } from '../validators/leccion.validator.js';
import { preguntaSchema } from '../validators/pregunta.validator.js';

export const leccionRoutes = Router();

const instructorDueno = [authenticate, authorize(ROLES.INSTRUCTOR), validate({ params: idParamSchema }), isLeccionOwner];
const estudianteInscrito = [authenticate, authorize(ROLES.ESTUDIANTE), validate({ params: idParamSchema }), isLeccionEnrolled];

leccionRoutes.get('/:id', ...estudianteInscrito, progresoController.getLeccion);
leccionRoutes.post('/:id/completar', ...estudianteInscrito, progresoController.completarLeccion);

leccionRoutes.put('/:id', ...instructorDueno, validate({ body: updateLeccionSchema }), leccionController.update);
leccionRoutes.delete('/:id', ...instructorDueno, leccionController.remove);
leccionRoutes.post('/:id/preguntas', ...instructorDueno, validate({ body: preguntaSchema }), preguntaController.create);
