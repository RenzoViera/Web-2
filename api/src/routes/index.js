import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { docsRoutes } from './docs.routes.js';
import { healthRoutes } from './health.routes.js';
import { usuarioRoutes } from './usuario.routes.js';

// Punto único de montaje de rutas bajo /api. Cada dominio agrega aquí su router.
export const apiRoutes = Router();

apiRoutes.use('/health', healthRoutes);
apiRoutes.use('/docs', docsRoutes);
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/users', usuarioRoutes);
