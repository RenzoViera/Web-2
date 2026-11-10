import { useCallback, useEffect, useRef } from 'react';

/**
 * Versión de `callback` que se ejecuta cuando pasan `delay` ms sin nuevas llamadas (búsqueda mientras se
 * escribe, REGLAS C.18). Siempre usa el `callback` más reciente y el temporizador se cancela al desmontar.
 * @template {unknown[]} A
 * @param {(...args: A) => void} callback
 * @param {number} [delay=300]
 * @returns {(...args: A) => void} Función estable mientras no cambie `delay`.
 */
export function useDebouncedCallback(callback, delay = 300) {
  const callbackRef = useRef(callback);
  const timerRef = useRef(/** @type {ReturnType<typeof setTimeout> | undefined} */ (undefined));

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return useCallback(
    /** @param {A} args */
    (...args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay],
  );
}
