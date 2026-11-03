import { Router } from 'express';
import { docsRoutes } from './docs.routes.js';
import { healthRoutes } from './health.routes.js';

// Punto único de montaje de rutas bajo /api. Cada dominio agrega aquí su router.
export const apiRoutes = Router();

apiRoutes.use('/health', healthRoutes);
apiRoutes.use('/docs', docsRoutes);
