import { useCallback, useMemo, useRef, useState } from 'react';
import { Toaster } from '@/components/ui/Toaster';
import { ToastContext } from './ToastContext';

/** @typedef {import('./ToastContext').Toast} Toast */
/** @typedef {import('./ToastContext').ToastVariant} ToastVariant */

const MAX_VISIBLE = 3;

/** @type {Readonly<Record<ToastVariant, number>>} */
const DURATION_MS = Object.freeze({
  success: 4000,
  info: 5000,
  warning: 6000,
  error: 7000,
});

/**
 * Notificaciones globales (reemplazo de `alert`). Se usan con `useToast()`.
 * @param {{ children: import('react').ReactNode }} props
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState(/** @type {Toast[]} */ ([]));
  const lastId = useRef(0);

  const dismiss = useCallback((/** @type {number} */ id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((/** @type {ToastVariant} */ variant, /** @type {string} */ message) => {
    lastId.current += 1;
    const toast = { id: lastId.current, variant, message, duration: DURATION_MS[variant] };
    setToasts((current) => {
      // El mismo aviso ya visible no se repite (p. ej. varios 401 seguidos).
      if (current.some((item) => item.variant === variant && item.message === message)) return current;
      return [...current, toast].slice(-MAX_VISIBLE);
    });
  }, []);

  const api = useMemo(
    () => ({
      success: (/** @type {string} */ message) => show('success', message),
      error: (/** @type {string} */ message) => show('error', message),
      warning: (/** @type {string} */ message) => show('warning', message),
      info: (/** @type {string} */ message) => show('info', message),
    }),
    [show],
  );

  return (
    <ToastContext value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext>
  );
}
