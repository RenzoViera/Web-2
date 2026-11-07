import axios from 'axios';
import { env } from '@/config/env';
import { getStoredToken } from '@/utils/authStorage';
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

/** @type {((error: ApiError) => void) | null} */
let unauthorizedHandler = null;

/**
 * Registra quién reacciona a un 401 de cualquier request (AuthProvider: cierra la sesión). `null` lo quita.
 * @param {((error: ApiError) => void) | null} handler
 */
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

/** @param {unknown} error */
export const isRequestCanceled = (error) => axios.isCancel(error);

/**
 * @param {import('axios').AxiosError<{
 *   error?: {
 *     code?: string,
 *     message?: string,
 *     details?: import('./ApiError').ApiErrorDetail[] | null,
 *     requestId?: string,
 *   },
 * }>} error
 */
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
    requestId: body?.requestId ?? response.headers?.['x-request-id'] ?? null,
    cause: error,
  });
};

// El token se lee en cada request: si se borra la sesión a mano, el siguiente request sale sin token → 401.
axiosClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Las cancelaciones (AbortController) se propagan tal cual para poder ignorarlas.
    if (isRequestCanceled(error)) return Promise.reject(error);

    const apiError = toApiError(error);
    if (apiError.status === 401) unauthorizedHandler?.(apiError);
    return Promise.reject(apiError);
  },
);
