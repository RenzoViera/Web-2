import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import './config/zod.js';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { requestId } from './middlewares/requestId.js';
import { apiRoutes } from './routes/index.js';

morgan.token('id', (req) => req.id);
const LOG_FORMAT = ':id :method :url :status :res[content-length] - :response-time ms';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestId);
  app.use(
    helmet({
      // La API se sirve por HTTP (Docker local): sin upgrade-insecure-requests para que Swagger UI cargue.
      contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
    }),
  );
  app.use(
    cors({
      origin: [...env.corsOrigins],
      exposedHeaders: ['X-Request-Id'],
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  if (!env.isTest) app.use(morgan(LOG_FORMAT));

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
