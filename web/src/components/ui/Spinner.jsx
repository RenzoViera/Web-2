import { cn } from '@/utils/cn';

const SIZES = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-10',
};

/**
 * @param {{
 *   size?: keyof typeof SIZES,
 *   label?: string,
 *   decorative?: boolean,
 *   className?: string,
 * }} props `decorative`: sin rol ni texto (p. ej. dentro de un botón con aria-busy).
 */
export function Spinner({ size = 'md', label = 'Cargando…', decorative = false, className }) {
  const svg = (
    <svg className={cn('animate-spin', SIZES[size])} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );

  if (decorative) return <span className={cn('inline-flex', className)}>{svg}</span>;

  return (
    <span role="status" className={cn('inline-flex items-center justify-center text-primary', className)}>
      {svg}
      <span className="sr-only">{label}</span>
    </span>
  );
}
