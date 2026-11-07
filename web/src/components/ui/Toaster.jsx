import { useEffect, useState } from 'react';
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, CloseIcon, InfoIcon } from '@/components/icons';
import { cn } from '@/utils/cn';
import { Button } from './Button';

/** @typedef {import('@/context/ToastContext').Toast} Toast */

const VARIANTS = {
  success: { Icon: CheckCircleIcon, icon: 'text-success' },
  error: { Icon: AlertCircleIcon, icon: 'text-danger' },
  warning: { Icon: AlertTriangleIcon, icon: 'text-warning' },
  info: { Icon: InfoIcon, icon: 'text-primary' },
};

/**
 * Pila de notificaciones bajo la navbar. La región `aria-live` está siempre montada para que los lectores
 * de pantalla anuncien cada aviso nuevo.
 * @param {{ toasts: Toast[], onDismiss: (id: number) => void }} props
 */
export function Toaster({ toasts, onDismiss }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-16 z-50 flex flex-col items-center gap-2 px-4 pt-3 sm:items-end sm:px-6"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/** @param {{ toast: Toast, onDismiss: (id: number) => void }} props */
function ToastItem({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false);
  const { Icon, icon } = VARIANTS[toast.variant];

  // Se cierra solo; el tiempo se pausa mientras el puntero o el foco están encima (da tiempo a leerlo).
  useEffect(() => {
    if (paused) return undefined;
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [paused, toast.id, toast.duration, onDismiss]);

  return (
    <div
      className="pointer-events-auto flex w-full max-w-sm animate-slide-down items-start gap-3 rounded-xl border border-border bg-surface py-3 pr-2 pl-4 shadow-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon className={cn('mt-1.5', icon)} />
      <p className="flex-1 py-1.5 text-sm text-fg">{toast.message}</p>
      <Button variant="ghost" size="iconSm" aria-label="Cerrar notificación" onClick={() => onDismiss(toast.id)}>
        <CloseIcon className="size-4" />
      </Button>
    </div>
  );
}
