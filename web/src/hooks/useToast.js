import { useContext } from 'react';
import { ToastContext } from '@/context/ToastContext';

/**
 * Notificaciones: `toast.success(msg)`, `toast.error(msg)`, `toast.warning(msg)`, `toast.info(msg)`.
 * @returns {import('@/context/ToastContext').ToastApi}
 */
export const useToast = () => {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return toast;
};
