import { Link } from 'react-router';
import { cn } from '@/utils/cn';

/**
 * Enlace de navegación dentro de un texto.
 * @param {import('react-router').LinkProps} props
 */
export function TextLink({ className, ...rest }) {
  return (
    <Link
      className={cn(
        'rounded font-medium text-primary underline-offset-4 hover:text-primary-hover hover:underline',
        className,
      )}
      {...rest}
    />
  );
}
