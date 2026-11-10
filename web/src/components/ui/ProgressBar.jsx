import { cn } from '@/utils/cn';

const SIZES = {
  sm: 'h-1.5',
  md: 'h-2.5',
};

/**
 * Barra de progreso accesible (`role="progressbar"`, 0-100). Al 100 % se pinta como completada.
 * El ancho llega como variable CSS (`--progress`) consumida por la clase `w-(--progress)` (REGLAS C.36).
 * @param {{
 *   value: number,
 *   label: string,
 *   size?: keyof typeof SIZES,
 *   className?: string,
 * }} props `label`: nombre accesible, p. ej. "Avance en Node.js desde cero".
 */
export function ProgressBar({ value, label, size = 'md', className }) {
  const percent = Math.min(100, Math.max(0, Math.round(value)));
  const progressVar = /** @type {import('react').CSSProperties} */ ({ '--progress': `${percent}%` });

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn('w-full overflow-hidden rounded-full bg-surface-muted', SIZES[size], className)}
    >
      <div
        className={cn(
          'h-full w-(--progress) rounded-full transition-[width] duration-300 motion-reduce:transition-none',
          percent === 100 ? 'bg-success' : 'bg-primary',
        )}
        style={progressVar}
      />
    </div>
  );
}
