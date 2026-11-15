import { sequelize } from '../config/database.js';
import { toPublicPregunta } from '../models/Pregunta.js';
import * as inscripcionRepo from '../repositories/inscripcion.repository.js';
import * as intentoRepo from '../repositories/intento.repository.js';
import * as leccionRepo from '../repositories/leccion.repository.js';
import * as preguntaRepo from '../repositories/pregunta.repository.js';
import * as progresoRepo from '../repositories/progreso.repository.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../utils/errorCodes.js';
import { MAX_INTENTOS_CUESTIONARIO } from '../validators/intento.validator.js';

/**
 * @typedef {{ completada: boolean, fechaCompletada: Date | null }} ProgresoItem
 *
 * @typedef {object} AvanceBloqueado Avance del estudiante leído con su inscripción bloqueada (`FOR UPDATE`).
 * @property {{ id: number, completado: boolean }} inscripcion
 * @property {Array<{ id: number, cursoId: number, titulo: string, tipo: string, orden: number, notaMinima: number | null }>} lecciones
 * @property {Map<number, ProgresoItem>} progresoPorLeccion
 *
 * @typedef {object} AvanceCurso Resumen del curso que devuelven las acciones del estudiante (completar, rendir).
 * @property {boolean} cursoCompletado
 * @property {number} totalLecciones
 * @property {number} leccionesCompletadas
 * @property {number} porcentaje
 * @property {number | null} siguienteLeccionId
 *
 * @typedef {object} ResumenIntentos Estado de los intentos de un cuestionario (RN-03).
 * @property {number} realizados
 * @property {number} maximo
 * @property {number} restantes
 * @property {number | null} mejorNota `null` si todavía no rindió.
 */

/**
 * Única fórmula del porcentaje de avance de una inscripción (Mis cursos, vista de lección y panel del instructor).
 * Un curso sin lecciones cuenta como 0 %.
 * @param {number} completadas Lecciones completadas (cuestionario completado = aprobado, RN-01).
 * @param {number} total Lecciones del curso.
 * @returns {number} Entero de 0 a 100.
 */
export const calcularPorcentaje = (completadas, total) => {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((completadas / total) * 100));
};

/**
 * Intentos realizados, restantes y mejor nota de un cuestionario (RN-03: máximo `MAX_INTENTOS_CUESTIONARIO`).
 * @param {number} realizados
 * @param {number | null} mejorNota
 * @returns {ResumenIntentos}
 */
export const resumirIntentos = (realizados, mejorNota) => ({
  realizados,
  maximo: MAX_INTENTOS_CUESTIONARIO,
  restantes: Math.max(0, MAX_INTENTOS_CUESTIONARIO - realizados),
  mejorNota,
});

/**
 * Construye el mapa de progresos indexado por `leccionId`.
 * @param {Array<{ leccionId: number, completada: boolean, fechaCompletada: Date | null }>} progresos
 * @returns {Map<number, ProgresoItem>}
 */
const mapProgresos = (progresos) => {
  const byLeccion = new Map();
  for (const p of progresos) {
    byLeccion.set(p.leccionId, p);
  }
  return byLeccion;
};

/**
 * Calcula estado secuencial de cada lección (RN-01) y totales agregados sin consultas extra.
 * Una lección está desbloqueada solo si todas las anteriores por `orden` están completadas.
 * @param {AvanceBloqueado['lecciones']} lecciones
 * @param {Map<number, ProgresoItem>} progresoPorLeccion
 */
const buildProgresoResumen = (lecciones, progresoPorLeccion) => {
  let todasAnterioresCompletadas = true;
  let leccionesCompletadas = 0;
  let primeraIncompletaId = null;

  const items = lecciones.map((leccion) => {
    const progreso = progresoPorLeccion.get(leccion.id);
    const completada = Boolean(progreso?.completada);
    const desbloqueada = todasAnterioresCompletadas;

    if (completada) {
      leccionesCompletadas += 1;
    } else if (primeraIncompletaId === null) {
      primeraIncompletaId = leccion.id;
    }

    todasAnterioresCompletadas = todasAnterioresCompletadas && completada;

    return {
      id: leccion.id,
      cursoId: leccion.cursoId,
      titulo: leccion.titulo,
      tipo: leccion.tipo,
      orden: leccion.orden,
      notaMinima: leccion.notaMinima ?? null,
      completada,
      desbloqueada,
      fechaCompletada: completada ? (progreso?.fechaCompletada ?? null) : null,
    };
  });

  const totalLecciones = items.length;
  const completado = totalLecciones > 0 && leccionesCompletadas === totalLecciones;
  const siguienteLeccionId = primeraIncompletaId ?? items[0]?.id ?? null;

  return {
    items,
    totalLecciones,
    leccionesCompletadas,
    porcentaje: calcularPorcentaje(leccionesCompletadas, totalLecciones),
    completado,
    siguienteLeccionId,
  };
};

/**
 * @param {ReturnType<typeof buildProgresoResumen>} resumen
 * @returns {AvanceCurso}
 */
const toAvanceCurso = (resumen) => ({
  cursoCompletado: resumen.completado,
  totalLecciones: resumen.totalLecciones,
  leccionesCompletadas: resumen.leccionesCompletadas,
  porcentaje: resumen.porcentaje,
  siguienteLeccionId: resumen.siguienteLeccionId,
});

/**
 * Verifica que todas las lecciones anteriores por `orden` estén completadas (RN-01).
 * @param {number} leccionId
 * @param {Array<{ id: number }>} lecciones Ordenadas por `(orden ASC, id ASC)`.
 * @param {Map<number, { completada: boolean }>} progresoPorLeccion
 * @returns {number} Índice de la lección en el temario ordenado.
 */
const assertLeccionDesbloqueada = (leccionId, lecciones, progresoPorLeccion) => {
  const index = lecciones.findIndex((item) => item.id === leccionId);
  if (index === -1) {
    throw new AppError(404, ERROR_CODES.LESSON_NOT_FOUND, 'Lección no encontrada');
  }
  for (let i = 0; i < index; i += 1) {
    if (!progresoPorLeccion.get(lecciones[i].id)?.completada) {
      throw new AppError(
        403,
        ERROR_CODES.LESSON_LOCKED,
        'Esta lección está bloqueada. Completa las lecciones anteriores para continuar.',
      );
    }
  }
  return index;
};

/**
 * Estado completo del avance del estudiante inscrito en un curso (RN-01, RN-08).
 * @param {number} usuarioId
 * @param {{ id: number, titulo: string, estado: string }} curso
 */
export const obtenerProgresoCurso = async (usuarioId, curso) => {
  const lecciones = await leccionRepo.findResumenByCurso(curso.id);
  const progresos = await progresoRepo.findByUsuarioAndLecciones(
    usuarioId,
    lecciones.map((l) => l.id),
  );
  const resumen = buildProgresoResumen(lecciones, mapProgresos(progresos));

  return {
    curso: { id: curso.id, titulo: curso.titulo, estado: curso.estado },
    completado: resumen.completado,
    totalLecciones: resumen.totalLecciones,
    leccionesCompletadas: resumen.leccionesCompletadas,
    porcentaje: resumen.porcentaje,
    siguienteLeccionId: resumen.siguienteLeccionId,
    lecciones: resumen.items,
  };
};

/**
 * Preguntas públicas (sin `indiceCorrecto`, RN-02) e intentos del estudiante en un cuestionario.
 * Son consultas independientes: van en paralelo (REGLAS B.27).
 * @param {number} usuarioId
 * @param {number} leccionId
 */
const obtenerCuestionario = async (usuarioId, leccionId) => {
  const [preguntas, { realizados, mejorNota }] = await Promise.all([
    preguntaRepo.findPublicByLeccion(leccionId),
    intentoRepo.getResumenByUsuarioAndLeccion(usuarioId, leccionId),
  ]);
  return { preguntas: preguntas.map(toPublicPregunta), intentos: resumirIntentos(realizados, mejorNota) };
};

/**
 * Contenido de una lección para el estudiante inscrito, validando desbloqueo secuencial (RN-01).
 * En cuestionarios devuelve preguntas públicas sin `indiceCorrecto` (RN-02) y el estado de sus intentos (RN-03);
 * en lecciones de contenido `preguntas` es `[]` e `intentos` es `null`.
 * @param {number} usuarioId
 * @param {import('../models/Leccion.js').Leccion & { curso?: { id: number, titulo: string, estado: string } }} leccion
 */
export const obtenerLeccionEstudiante = async (usuarioId, leccion) => {
  const lecciones = await leccionRepo.findResumenByCurso(leccion.cursoId);
  const progresos = await progresoRepo.findByUsuarioAndLecciones(
    usuarioId,
    lecciones.map((l) => l.id),
  );
  const progresoPorLeccion = mapProgresos(progresos);
  const index = assertLeccionDesbloqueada(leccion.id, lecciones, progresoPorLeccion);

  const progresoActual = progresoPorLeccion.get(leccion.id);
  const completada = Boolean(progresoActual?.completada);
  const { preguntas, intentos } =
    leccion.tipo === 'cuestionario'
      ? await obtenerCuestionario(usuarioId, leccion.id)
      : { preguntas: [], intentos: null };

  return {
    id: leccion.id,
    cursoId: leccion.cursoId,
    titulo: leccion.titulo,
    contenido: leccion.contenido,
    videoUrl: leccion.videoUrl,
    tipo: leccion.tipo,
    orden: leccion.orden,
    notaMinima: leccion.notaMinima,
    completada,
    fechaCompletada: completada ? (progresoActual?.fechaCompletada ?? null) : null,
    anteriorLeccionId: index > 0 ? lecciones[index - 1].id : null,
    siguienteLeccionId: index < lecciones.length - 1 ? lecciones[index + 1].id : null,
    preguntas,
    intentos,
  };
};

/**
 * Lee el avance del estudiante para modificarlo: bloquea su inscripción (`FOR UPDATE`) para serializar las
 * escrituras concurrentes del mismo curso y verifica el desbloqueo secuencial de la lección (RN-01).
 * Lo comparten completar una lección y rendir un cuestionario. Va dentro de una transacción.
 * @param {number} usuarioId
 * @param {{ id: number, cursoId: number }} leccion
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<AvanceBloqueado>}
 */
export const bloquearAvance = async (usuarioId, leccion, transaction) => {
  const inscripcion = await inscripcionRepo.lockByUsuarioAndCurso(usuarioId, leccion.cursoId, transaction);
  if (!inscripcion) {
    throw new AppError(403, ERROR_CODES.NOT_ENROLLED, 'No estás inscrito en este curso');
  }

  const lecciones = await leccionRepo.findResumenByCurso(leccion.cursoId, { transaction });
  const progresos = await progresoRepo.findByUsuarioAndLecciones(
    usuarioId,
    lecciones.map((l) => l.id),
    { transaction },
  );
  const progresoPorLeccion = mapProgresos(progresos);
  assertLeccionDesbloqueada(leccion.id, lecciones, progresoPorLeccion);

  return { inscripcion, lecciones, progresoPorLeccion };
};

/**
 * Resumen del curso según el avance leído (sin escribir).
 * @param {AvanceBloqueado} avance
 * @returns {AvanceCurso}
 */
export const resumirAvance = (avance) => toAvanceCurso(buildProgresoResumen(avance.lecciones, avance.progresoPorLeccion));

/**
 * Marca la lección como completada (idempotente) y sincroniza `inscripciones.completado` al llegar al 100 %.
 * Va en la misma transacción que `bloquearAvance`.
 * @param {number} usuarioId
 * @param {number} leccionId
 * @param {AvanceBloqueado} avance
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<{ fechaCompletada: Date | null, curso: AvanceCurso }>}
 */
export const marcarCompletadaEnAvance = async (usuarioId, leccionId, avance, transaction) => {
  const progreso = await progresoRepo.markCompletada(usuarioId, leccionId, new Date(), { transaction });
  const progresoPorLeccion = new Map(avance.progresoPorLeccion).set(leccionId, {
    completada: true,
    fechaCompletada: progreso.fechaCompletada,
  });

  const resumen = buildProgresoResumen(avance.lecciones, progresoPorLeccion);
  if (Boolean(avance.inscripcion.completado) !== resumen.completado) {
    await inscripcionRepo.updateCompletado(avance.inscripcion.id, resumen.completado, { transaction });
  }

  return { fechaCompletada: progreso.fechaCompletada, curso: toAvanceCurso(resumen) };
};

/**
 * Marca una lección de contenido como completada y actualiza `inscripciones.completado` en transacción.
 * Los cuestionarios solo se completan al aprobarlos (RN-01, `cuestionario.service.js`).
 * @param {number} usuarioId
 * @param {{ id: number, cursoId: number, tipo: string }} leccion
 */
export const completarLeccion = (usuarioId, leccion) => {
  if (leccion.tipo !== 'contenido') {
    throw new AppError(
      422,
      ERROR_CODES.LESSON_NOT_CONTENT,
      'Los cuestionarios se completan al aprobarlos, no manualmente.',
    );
  }

  return sequelize.transaction(async (transaction) => {
    const avance = await bloquearAvance(usuarioId, leccion, transaction);
    const { fechaCompletada, curso } = await marcarCompletadaEnAvance(usuarioId, leccion.id, avance, transaction);
    return { leccionId: leccion.id, completada: true, fechaCompletada, ...curso };
  });
};
