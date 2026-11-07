import { authRequired, verifyToken } from '../services/auth.service.js';

const BEARER = /^Bearer\s+(\S+)$/i;

/**
 * Exige `Authorization: Bearer <jwt>` válido y deja `req.user = { id, rol }`.
 * Sin header → 401 UNAUTHORIZED; token inválido → 401 INVALID_TOKEN; expirado → 401 TOKEN_EXPIRED.
 */
export const authenticate = (req, _res, next) => {
  const match = BEARER.exec(req.get('Authorization') ?? '');
  if (!match) throw authRequired();
  req.user = verifyToken(match[1]);
  next();
};
