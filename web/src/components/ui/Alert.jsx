import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, InfoIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

const VARIANTS = {
  error: { Icon: AlertCircleIcon, container: 'border-danger/20 bg-danger-soft', icon: 'text-danger' },
  warning: { Icon: AlertTriangleIcon, container: 'border-warning/20 bg-warning-soft', icon: 'text-warning' },
  success: { Icon: CheckCircleIcon, container: 'border-success/20 bg-success-soft', icon: 'text-success' },
  info: { Icon: InfoIcon, container: 'border-primary/20 bg-primary-soft', icon: 'text-primary' },
};

/**
 * Mensaje en línea dentro de una vista o formulario (p. ej. el error general de un envío).
 * `error` se anuncia de inmediato (`role="alert"`); el resto, de forma cortés (`role="status"`).
 * @param {{
 *   variant?: keyof typeof VARIANTS,
 *   children: import('react').ReactNode,
 *   className?: string,
 * }} props
 */
export function Alert({ variant = 'info', children, className }) {
  const { Icon, container, icon } = VARIANTS[variant];

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex animate-fade-in items-start gap-3 rounded-lg border px-4 py-3 text-sm text-fg', container, className)}
    >
      <Icon className={cn('mt-px size-4', icon)} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
