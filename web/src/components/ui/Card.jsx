import { cn } from '@/utils/cn';

/* `cn` no resuelve conflictos entre clases: el padding se elige con la prop, no pisándolo desde `className`. */
const PADDINGS = {
  md: 'p-5 sm:p-6',
  sm: 'p-4',
  none: '',
};

/**
 * Contenedor con borde y fondo de superficie.
 * @param {{
 *   as?: 'div' | 'section' | 'article',
 *   padding?: keyof typeof PADDINGS,
 *   className?: string,
 *   children: import('react').ReactNode,
 * } & import('react').HTMLAttributes<HTMLElement>} props `padding`: `sm` para tarjetas chicas (métricas, filas en
 *   móvil); `none` cuando el contenido maneja su propio padding (p. ej. una portada a sangre).
 */
export function Card({ as: Component = 'div', padding = 'md', className, children, ...rest }) {
  return (
    <Component
      className={cn('rounded-xl border border-border bg-surface shadow-sm', PADDINGS[padding], className)}
      {...rest}
    >
      {children}
    </Component>
  );
}
