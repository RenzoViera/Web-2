import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/names';

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-xl',
};

/**
 * Iniciales del usuario en un círculo. Decorativo: el nombre siempre se muestra (o se anuncia) al lado.
 * @param {{ name: string, size?: keyof typeof SIZES, className?: string }} props
 */
export function Avatar({ name, size = 'md', className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary select-none',
        SIZES[size],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
