import { sequelize } from '../config/database.js';
import * as intentoRepo from '../repositories/intento.repository.js';
import * as preguntaRepo from '../repositories/pregunta.repository.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../utils/errorCodes.js';
import { MAX_INTENTOS_CUESTIONARIO } from '../validators/intento.validator.js';
import { bloquearAvance, marcarCompletadaEnAvance, resumirAvance, resumirIntentos } from './progreso.service.js';

/**
 * @typedef {{ preguntaId: number, indice: number }} Respuesta
 * @typedef {{ id: number, opciones: string[], indiceCorrecto: number }} ClavePregunta
 */

/**
 * Nota de un intento: `round(aciertos / total * 100)`.
 * @param {number} aciertos
 * @param {number} total
 * @returns {number} Entero de 0 a 100.
 */
export const calcularNota = (aciertos, total) => (total > 0 ? Math.round((aciertos / total) * 100) : 0);

/**
 * Califica en el servidor (RN-02): exige una respuesta por cada pregunta del cuestionario, ninguna ajena y con
 * una opción existente. Devuelve solo la cantidad de aciertos; cuáles eran correctas nunca sale de aquí.
 * @param {ClavePregunta[]} preguntas Ordenadas como las ve el estudiante (por `id`).
 * @param {Respuesta[]} respuestas
 * @returns {number} Aciertos.
 */
const calificar = (preguntas, respuestas) => {
  const elegidas = new Map(respuestas.map(({ preguntaId, indice }) => [preguntaId, indice]));
  const ids = new Set(preguntas.map((pregunta) => pregunta.id));
  /** @type {Array<{ location: 'body', field: string, message: string }>} */
  const details = [];

  preguntas.forEach((pregunta, posicion) => {
    const indice = elegidas.get(pregunta.id);
    if (indice === undefined) {
      details.push({ location: 'body', field: 'respuestas', message: `Falta responder la pregunta ${posicion + 1}` });
    } else if (indice >= pregunta.opciones.length) {
      details.push({
        location: 'body',
        field: 'respuestas',
        message: `La opción elegida en la pregunta ${posicion + 1} no existe`,
      });
    }
  });
  if (respuestas.some((respuesta) => !ids.has(respuesta.preguntaId))) {
    details.push({ location: 'body', field: 'respuestas', message: 'Hay respuestas de preguntas que no son de este cuestionario' });
  }

  if (details.length > 0) {
    throw new AppError(
      422,
      ERROR_CODES.INVALID_QUIZ_ANSWERS,
      'Tus respuestas no coinciden con las preguntas del cuestionario. Responde todas las preguntas e inténtalo de nuevo.',
      details,
    );
  }

  return preguntas.filter((pregunta) => elegidas.get(pregunta.id) === pregunta.indiceCorrecto).length;
};

/**
 * Registra un intento del estudiante en un cuestionario desbloqueado (RN-01, RN-02, RN-03), en una transacción:
 * - 422 `LESSON_NOT_QUIZ` si la lección no es cuestionario; 403 `LESSON_LOCKED` si está bloqueada.
 * - 403 `ATTEMPTS_EXHAUSTED` si ya usó los `MAX_INTENTOS_CUESTIONARIO` intentos. Se puede volver a rendir uno ya
 *   aprobado mientras queden intentos (§6 del plan).
 * - Califica en el servidor y guarda el intento; el cuestionario queda completado cuando la mejor nota alcanza la
 *   mínima (un intento peor no lo descompleta) y, si con eso termina el curso, `inscripciones.completado = true`.
 * El bloqueo `FOR UPDATE` de la inscripción serializa dos envíos simultáneos: el segundo cuenta el intento del primero.
 * @param {number} usuarioId
 * @param {{ id: number, cursoId: number, tipo: string, notaMinima: number }} leccion
 * @param {Respuesta[]} respuestas
 */
export const rendirCuestionario = (usuarioId, leccion, respuestas) => {
  if (leccion.tipo !== 'cuestionario') {
    throw new AppError(422, ERROR_CODES.LESSON_NOT_QUIZ, 'Esta lección no es un cuestionario');
  }

  return sequelize.transaction(async (transaction) => {
    const avance = await bloquearAvance(usuarioId, leccion, transaction);

    const { realizados, mejorNota: mejorNotaAnterior } = await intentoRepo.getResumenByUsuarioAndLeccion(
      usuarioId,
      leccion.id,
      { transaction },
    );
    if (realizados >= MAX_INTENTOS_CUESTIONARIO) {
      throw new AppError(
        403,
        ERROR_CODES.ATTEMPTS_EXHAUSTED,
        `Ya usaste los ${MAX_INTENTOS_CUESTIONARIO} intentos de este cuestionario.`,
      );
    }

    const preguntas = await preguntaRepo.findClavesByLeccion(leccion.id, { transaction });
    if (preguntas.length === 0) {
      throw new AppError(422, ERROR_CODES.QUIZ_WITHOUT_QUESTIONS, 'Este cuestionario todavía no tiene preguntas');
    }

    const aciertos = calificar(preguntas, respuestas);
    const nota = calcularNota(aciertos, preguntas.length);
    const aprobado = nota >= leccion.notaMinima;
    const mejorNota = Math.max(nota, mejorNotaAnterior ?? 0);

    await intentoRepo.create(
      { usuarioId, leccionId: leccion.id, puntaje: nota, aprobado, respuestas, numeroIntento: realizados + 1 },
      { transaction },
    );

    const progresoPrevio = avance.progresoPorLeccion.get(leccion.id);
    const yaCompletada = Boolean(progresoPrevio?.completada);
    const completada = yaCompletada || mejorNota >= leccion.notaMinima;

    const { fechaCompletada, curso } =
      completada && !yaCompletada
        ? await marcarCompletadaEnAvance(usuarioId, leccion.id, avance, transaction)
        : { fechaCompletada: progresoPrevio?.fechaCompletada ?? null, curso: resumirAvance(avance) };

    return {
      leccionId: leccion.id,
      nota,
      aprobado,
      aciertos,
      totalPreguntas: preguntas.length,
      notaMinima: leccion.notaMinima,
      completada,
      fechaCompletada,
      intentos: resumirIntentos(realizados + 1, mejorNota),
      ...curso,
    };
  });
};
