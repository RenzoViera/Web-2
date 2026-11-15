/** Nota máxima de un cuestionario (la API califica de 0 a 100). */
export const NOTA_MAXIMA = 100;

/**
 * Si tiene sentido volver a rendir un cuestionario ya aprobado: quedan intentos y la mejor nota no es la máxima.
 * @param {import('@/services/progresoService').ResumenIntentos} intentos
 */
export const puedeMejorarNota = (intentos) => intentos.restantes > 0 && (intentos.mejorNota ?? 0) < NOTA_MAXIMA;

/**
 * "Te queda 1 intento" / "Te quedan 2 intentos".
 * @param {number} restantes
 */
export const intentosRestantesLabel = (restantes) =>
  restantes === 1 ? 'Te queda 1 intento' : `Te quedan ${restantes} intentos`;
