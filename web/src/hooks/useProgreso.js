import { useCallback, useMemo, useState } from 'react';
import { ApiError, isExpectedApiError } from '@/api/ApiError';
import { useFetch } from '@/hooks/useFetch';
import { useToast } from '@/hooks/useToast';
import { intentosService } from '@/services/intentosService';
import { progresoService } from '@/services/progresoService';

/** @typedef {import('@/services/progresoService').CursoProgreso} CursoProgreso */
/** @typedef {import('@/services/progresoService').LeccionEstudiante} LeccionEstudiante */
/** @typedef {import('@/services/progresoService').ResumenIntentos} ResumenIntentos */
/** @typedef {import('@/services/intentosService').RespuestaIntento} RespuestaIntento */
/** @typedef {import('@/services/intentosService').IntentoResultado} IntentoResultado */
/** @typedef {{ fechaCompletada: string | null }} LeccionCompletadaPatch */

/**
 * Aplica las lecciones completadas localmente en la sesión sobre el progreso cargado (REGLAS C.14),
 * recalculando el desbloqueo secuencial y totales en memoria sin refetch global.
 * @param {CursoProgreso} base
 * @param {Record<number, LeccionCompletadaPatch>} overrides
 * @returns {CursoProgreso}
 */
const mergeProgreso = (base, overrides) => {
  const entries = Object.values(overrides);
  if (entries.length === 0) return base;

  let todasAnterioresCompletadas = true;
  let leccionesCompletadas = 0;
  let primeraIncompletaId = /** @type {number | null} */ (null);

  const lecciones = base.lecciones.map((item) => {
    const patch = overrides[item.id];
    const completada = item.completada || Boolean(patch);
    const desbloqueada = todasAnterioresCompletadas;
    todasAnterioresCompletadas = todasAnterioresCompletadas && completada;

    if (completada) {
      leccionesCompletadas += 1;
    } else if (primeraIncompletaId === null) {
      primeraIncompletaId = item.id;
    }

    const fechaCompletada = item.fechaCompletada ?? patch?.fechaCompletada ?? null;
    if (completada === item.completada && desbloqueada === item.desbloqueada && fechaCompletada === item.fechaCompletada) {
      return item;
    }
    return { ...item, completada, desbloqueada, fechaCompletada };
  });

  const totalLecciones = lecciones.length;
  const completado = totalLecciones > 0 && leccionesCompletadas === totalLecciones;
  const porcentaje = totalLecciones > 0 ? Math.min(100, Math.round((leccionesCompletadas / totalLecciones) * 100)) : 0;

  return {
    ...base,
    completado,
    totalLecciones,
    leccionesCompletadas,
    porcentaje,
    siguienteLeccionId: primeraIncompletaId ?? lecciones[0]?.id ?? null,
    lecciones,
  };
};

/**
 * Intentos más recientes entre los de la lección cargada y los registrados en la sesión (la lección pudo
 * recargarse después de rendir).
 * @param {ResumenIntentos | null} base
 * @param {ResumenIntentos | undefined} patch
 * @returns {ResumenIntentos | null}
 */
const latestIntentos = (base, patch) => {
  if (!patch) return base;
  if (!base) return patch;
  return patch.realizados >= base.realizados ? patch : base;
};

/**
 * Carga en paralelo el avance del curso y la lección activa reutilizando `useFetch` (REGLAS C.20, C.27)
 * y actualiza el estado local al completar una lección o rendir un cuestionario, sin refetch global (C.14).
 *
 * @param {number | null} cursoId
 * @param {number | null} leccionId
 */
export function useProgreso(cursoId, leccionId) {
  const toast = useToast();
  const [completedByCurso, setCompletedByCurso] = useState(
    /** @type {Record<number, Record<number, LeccionCompletadaPatch>>} */ ({}),
  );
  const [intentosByLeccion, setIntentosByLeccion] = useState(/** @type {Record<number, ResumenIntentos>} */ ({}));

  const {
    data: progresoBase,
    loading: progresoLoading,
    error: progresoError,
    refetch: refetchProgreso,
  } = useFetch(({ signal }) => progresoService.getCursoProgreso(/** @type {number} */ (cursoId), { signal }), [cursoId], {
    immediate: Boolean(cursoId),
  });

  const {
    data: leccionBase,
    loading: leccionLoading,
    error: leccionError,
    refetch: refetchLeccion,
  } = useFetch(({ signal }) => progresoService.getLeccion(/** @type {number} */ (leccionId), { signal }), [leccionId], {
    immediate: Boolean(leccionId),
  });

  const cursoOverrides = useMemo(
    () => (cursoId ? completedByCurso[cursoId] ?? {} : {}),
    [completedByCurso, cursoId],
  );

  const progreso = useMemo(() => {
    if (!progresoBase || progresoBase.curso.id !== cursoId) return null;
    return mergeProgreso(progresoBase, cursoOverrides);
  }, [progresoBase, cursoId, cursoOverrides]);

  const leccion = useMemo(() => {
    if (!leccionBase || leccionBase.id !== leccionId) return null;
    const completadaPatch = completedByCurso[leccionBase.cursoId]?.[leccionBase.id];
    const intentos = latestIntentos(leccionBase.intentos, intentosByLeccion[leccionBase.id]);
    const completada = leccionBase.completada || Boolean(completadaPatch);
    if (completada === leccionBase.completada && intentos === leccionBase.intentos) return leccionBase;
    return {
      ...leccionBase,
      completada,
      fechaCompletada: leccionBase.fechaCompletada ?? completadaPatch?.fechaCompletada ?? null,
      intentos,
    };
  }, [leccionBase, leccionId, completedByCurso, intentosByLeccion]);

  const targetCursoId = leccionBase?.cursoId ?? cursoId;

  /**
   * @param {number} completadaId
   * @param {string | null} fechaCompletada
   */
  const registrarCompletada = useCallback(
    (completadaId, fechaCompletada) => {
      if (!targetCursoId) return;
      setCompletedByCurso((prev) => ({
        ...prev,
        [targetCursoId]: { ...(prev[targetCursoId] ?? {}), [completadaId]: { fechaCompletada } },
      }));
    },
    [targetCursoId],
  );

  const marcarCompletada = useCallback(async () => {
    if (!leccionId) return;
    try {
      const res = await progresoService.completarLeccion(leccionId);
      registrarCompletada(res.leccionId, res.fechaCompletada);
      toast.success(
        res.cursoCompletado
          ? '¡Felicitaciones! Completaste todas las lecciones del curso.'
          : 'Lección marcada como completada.',
      );
    } catch (err) {
      if (!isExpectedApiError(err)) throw err;
      if (err.status !== 401) toast.error(err.message);
    }
  }, [leccionId, registrarCompletada, toast]);

  /**
   * Rinde el cuestionario activo. Los errores se propagan para que el formulario los muestre; si la API dice que
   * no quedan intentos (p. ej. se rindió en otra pestaña), recarga la lección para mostrar su estado real.
   * @param {RespuestaIntento[]} respuestas
   * @returns {Promise<IntentoResultado>}
   */
  const rendirCuestionario = useCallback(
    async (respuestas) => {
      if (!leccionId) throw new Error('No hay una lección activa para rendir.');
      try {
        const res = await intentosService.rendir(leccionId, respuestas);
        setIntentosByLeccion((prev) => ({ ...prev, [res.leccionId]: res.intentos }));
        if (res.completada) registrarCompletada(res.leccionId, res.fechaCompletada);
        return res;
      } catch (err) {
        if (err instanceof ApiError && err.code === 'ATTEMPTS_EXHAUSTED') refetchLeccion();
        throw err;
      }
    },
    [leccionId, refetchLeccion, registrarCompletada],
  );

  return {
    progreso,
    progresoLoading,
    progresoError,
    refetchProgreso,
    leccion,
    leccionLoading,
    leccionError,
    refetchLeccion,
    marcarCompletada,
    rendirCuestionario,
  };
}
