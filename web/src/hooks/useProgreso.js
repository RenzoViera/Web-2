import { useCallback, useMemo, useState } from 'react';
import { isExpectedApiError } from '@/api/ApiError';
import { useFetch } from '@/hooks/useFetch';
import { useToast } from '@/hooks/useToast';
import { progresoService } from '@/services/progresoService';

/** @typedef {import('@/services/progresoService').CursoProgreso} CursoProgreso */
/** @typedef {import('@/services/progresoService').LeccionEstudiante} LeccionEstudiante */
/** @typedef {import('@/services/progresoService').CompletarLeccionResponse} CompletarLeccionResponse */

/**
 * Aplica las lecciones completadas localmente en la sesión sobre el progreso cargado (REGLAS C.14),
 * recalculando el desbloqueo secuencial y totales en memoria sin refetch global.
 * @param {CursoProgreso} base
 * @param {Record<number, CompletarLeccionResponse>} overrides
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
 * Carga en paralelo el avance del curso y la lección activa reutilizando `useFetch` (REGLAS C.20, C.27)
 * y actualiza el estado local al completar la lección sin refetch global (C.14).
 *
 * @param {number | null} cursoId
 * @param {number | null} leccionId
 */
export function useProgreso(cursoId, leccionId) {
  const toast = useToast();
  const [completedByCurso, setCompletedByCurso] = useState(
    /** @type {Record<number, Record<number, CompletarLeccionResponse>>} */ ({}),
  );

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
    const patch = completedByCurso[leccionBase.cursoId]?.[leccionBase.id];
    if (!patch || leccionBase.completada) return leccionBase;
    return {
      ...leccionBase,
      completada: true,
      fechaCompletada: leccionBase.fechaCompletada ?? patch.fechaCompletada,
    };
  }, [leccionBase, leccionId, completedByCurso]);

  const baseCursoId = leccionBase?.cursoId;
  const marcarCompletada = useCallback(async () => {
    if (!leccionId) return;
    try {
      const res = await progresoService.completarLeccion(leccionId);
      const targetCursoId = baseCursoId ?? cursoId;
      if (targetCursoId) {
        setCompletedByCurso((prev) => ({
          ...prev,
          [targetCursoId]: {
            ...(prev[targetCursoId] ?? {}),
            [res.leccionId]: res,
          },
        }));
      }
      toast.success(
        res.cursoCompletado
          ? '¡Felicitaciones! Completaste todas las lecciones del curso.'
          : 'Lección marcada como completada.',
      );
    } catch (err) {
      if (!isExpectedApiError(err)) throw err;
      if (err.status !== 401) toast.error(err.message);
    }
  }, [baseCursoId, cursoId, leccionId, toast]);

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
  };
}
