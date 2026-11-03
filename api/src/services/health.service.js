import { sequelize } from '../config/database.js';

const DB_CHECK_TIMEOUT_MS = 3000;

const checkDatabase = async () => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), DB_CHECK_TIMEOUT_MS);
  });
  try {
    await Promise.race([sequelize.authenticate(), timeout]);
    return 'up';
  } catch {
    return 'down';
  } finally {
    clearTimeout(timer);
  }
};

/** @returns {Promise<{ status: 'ok' | 'degraded', database: 'up' | 'down', uptime: number, timestamp: string }>} */
export const getHealthStatus = async () => {
  const database = await checkDatabase();
  return {
    status: database === 'up' ? 'ok' : 'degraded',
    database,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
};
