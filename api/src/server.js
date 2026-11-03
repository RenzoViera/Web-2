import { createApp } from './app.js';
import { sequelize } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const start = async () => {
  await sequelize.authenticate();
  logger.info(`Conectado a PostgreSQL en ${env.db.host}:${env.db.port}/${env.db.name}`);

  const server = createApp().listen(env.port, () => {
    logger.info(`API escuchando en el puerto ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} recibido, cerrando servidor...`);
    const forceExit = setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
};

process.on('unhandledRejection', (reason) => {
  logger.error('Promesa rechazada sin manejar', reason);
  process.exit(1);
});

start().catch((error) => {
  logger.error('No se pudo iniciar la API', error);
  process.exit(1);
});
