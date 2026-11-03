import { randomUUID } from 'node:crypto';

const HEADER = 'X-Request-Id';
const VALID_ID = /^[\w-]{8,64}$/;

/** Asigna un id a cada request (reutiliza el del cliente si es válido) y lo devuelve en el header. */
export const requestId = (req, res, next) => {
  const incoming = req.get(HEADER);
  req.id = incoming && VALID_ID.test(incoming) ? incoming : randomUUID();
  res.set(HEADER, req.id);
  next();
};
