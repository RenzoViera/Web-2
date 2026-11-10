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

/**
 * Autenticación opcional para rutas públicas que cambian según quién mira (detalle de curso → `inscrito`).
 * Con token válido deja `req.user`; sin token o con uno inválido/expirado sigue como visitante (nunca 401):
 * la página pública no debe romperse por una sesión vencida, que el cliente detecta con `GET /users/me`.
 */
export const optionalAuthenticate = (req, _res, next) => {
  const match = BEARER.exec(req.get('Authorization') ?? '');
  if (match) {
    try {
      req.user = verifyToken(match[1]);
    } catch {
      req.user = undefined;
    }
  }
  next();
};
