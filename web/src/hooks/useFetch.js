import { useCallback, useEffect, useRef, useState } from 'react';
import { isRequestCanceled } from '@/api/axiosClient';

/**
 * Hook personalizado para peticiones asíncronas con ciclo de vida, soporte de cancelación y refetch.
 *
 * @template T
 * @param {(options: { signal: AbortSignal }) => Promise<T>} fetcher Función que realiza la petición y acepta signal.
 * @param {import('react').DependencyList} [deps=[]] Dependencias que disparan una nueva petición.
 * @param {{ immediate?: boolean }} [options]
 * @returns {{ data: T | null, loading: boolean, error: import('@/api/ApiError').ApiError | Error | null, refetch: () => Promise<void> }}
 */
export function useFetch(fetcher, deps = [], options = {}) {
  const { immediate = true } = options;
  const [data, setData] = useState(/** @type {T | null} */ (null));
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(/** @type {import('@/api/ApiError').ApiError | Error | null} */ (null));

  const abortControllerRef = useRef(/** @type {AbortController | null} */ (null));
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current({ signal: controller.signal });
      if (!controller.signal.aborted) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (!controller.signal.aborted && !isRequestCanceled(err)) {
        setError(/** @type {import('@/api/ApiError').ApiError} */ (err));
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, immediate, ...deps]);

  return { data, loading, error, refetch: execute };
}
