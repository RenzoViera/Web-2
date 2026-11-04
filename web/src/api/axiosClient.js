import axios from 'axios';
import { env } from '@/config/env';
import { ApiError } from './ApiError';

const REQUEST_TIMEOUT_MS = 15_000;
const NETWORK_ERROR_MESSAGE = 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
const TIMEOUT_MESSAGE = 'El servidor tardó demasiado en responder. Inténtalo de nuevo.';
const UNKNOWN_ERROR_MESSAGE = 'Ocurrió un error inesperado.';

/** Instancia única de axios. Los componentes nunca la usan directo: solo `services/`. */
export const axiosClient = axios.create({
  baseURL: env.apiUrl,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
});

/** @param {unknown} error */
export const isRequestCanceled = (error) => axios.isCancel(error);

/** @param {import('axios').AxiosError<{ error?: { code?: string, message?: string, details?: [] | null } }>} error */
const toApiError = (error) => {
  const { response } = error;

  if (!response) {
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    return new ApiError({
      status: 0,
      code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: isTimeout ? TIMEOUT_MESSAGE : NETWORK_ERROR_MESSAGE,
      cause: error,
    });
  }

  const body = response.data?.error;
  return new ApiError({
    status: response.status,
    code: body?.code ?? 'UNKNOWN_ERROR',
    message: body?.message ?? UNKNOWN_ERROR_MESSAGE,
    details: body?.details ?? null,
    requestId: response.headers?.['x-request-id'] ?? null,
    cause: error,
  });
};

axiosClient.interceptors.response.use(
  (response) => response,
  // Las cancelaciones (AbortController) se propagan tal cual para poder ignorarlas.
  (error) => Promise.reject(isRequestCanceled(error) ? error : toApiError(error)),
);
