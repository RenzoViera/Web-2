import { getHealthStatus } from '../services/health.service.js';

export const getHealth = async (_req, res) => {
  const health = await getHealthStatus();
  res.status(health.status === 'ok' ? 200 : 503).json(health);
};
