import { cn } from '@/utils/cn';

/*
 * Variantes con contraste AA para texto chico. Antes de sumar success/warning/danger, verificar el contraste:
 * los tokens actuales de esos colores sobre su fondo `-soft` no llegan a 4.5:1.
 */
const VARIANTS = {
  neutral: 'bg-surface-muted text-fg-muted border border-border',
  primary: 'bg-primary-soft text-primary font-medium border border-primary/20',
  success: 'bg-success-soft text-fg font-medium border border-success/30',
  warning: 'bg-warning-soft text-fg font-medium border border-warning/30',
  danger: 'bg-danger-soft text-danger font-medium border border-danger/20',
};

/** @typedef {keyof typeof VARIANTS} BadgeVariant */

/**
 * Etiqueta corta de estado o categoría (rol, estado de un curso…).
 * @param {{ variant?: BadgeVariant, children: import('react').ReactNode, className?: string }} props
 */
export function Badge({ variant = 'neutral', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
