import { useState } from 'react';
import { cn } from '@/utils/cn';
import { buttonClasses } from './buttonStyles';
import { Spinner } from './Spinner';

/**
 * Botón único del proyecto. Si `onClick` devuelve una promesa, muestra loading
 * hasta que termine y bloquea el doble envío. En formularios usar `loading={isSubmitting}`.
 *
 * @param {import('./buttonStyles').ButtonStyleProps & {
 *   loading?: boolean,
 * } & Omit<import('react').ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
 *   onClick?: (event: import('react').MouseEvent<HTMLButtonElement>) => unknown,
 *   ref?: import('react').Ref<HTMLButtonElement>,
 * }} props
 */
export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className,
  children,
  ...rest
}) {
  const [pending, setPending] = useState(false);
  const isLoading = loading || pending;

  /** @param {import('react').MouseEvent<HTMLButtonElement>} event */
  const handleClick = (event) => {
    if (isLoading) {
      event.preventDefault();
      return;
    }
    const result = onClick?.(event);
    if (result && typeof (/** @type {Promise<unknown>} */ (result).then) === 'function') {
      setPending(true);
      // El error (si lo hay) sigue propagándose: lo maneja quien llamó o el listener global.
      Promise.resolve(result).finally(() => setPending(false));
    }
  };

  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      onClick={handleClick}
      {...rest}
    >
      <span className={cn('inline-flex items-center gap-2', isLoading && 'invisible')}>{children}</span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" decorative />
        </span>
      )}
    </button>
  );
}
