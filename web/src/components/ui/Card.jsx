import { cn } from '@/utils/cn';

/**
 * Contenedor con borde y fondo de superficie.
 * @param {{
 *   as?: 'div' | 'section' | 'article',
 *   className?: string,
 *   children: import('react').ReactNode,
 * } & import('react').HTMLAttributes<HTMLElement>} props
 */
export function Card({ as: Component = 'div', className, children, ...rest }) {
  return (
    <Component className={cn('rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6', className)} {...rest}>
      {children}
    </Component>
  );
}
