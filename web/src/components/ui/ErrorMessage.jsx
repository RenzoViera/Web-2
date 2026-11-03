import { AlertTriangleIcon } from '@/components/icons';
import { cn } from '@/utils/cn';
import { Button } from './Button';

/**
 * Estado de error de una vista o sección con datos remotos.
 * @param {{
 *   title?: string,
 *   message?: string,
 *   onRetry?: () => unknown,
 *   className?: string,
 * }} props
 */
export function ErrorMessage({ title = 'No se pudo cargar la información', message, onRetry, className }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex animate-fade-in flex-col items-center gap-3 rounded-xl border border-danger/20 bg-danger-soft px-4 py-8 text-center',
        className,
      )}
    >
      <AlertTriangleIcon className="size-8 text-danger" />
      <div className="max-w-md">
        <p className="font-semibold text-fg">{title}</p>
        {message && <p className="mt-1 text-sm text-fg-muted">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
