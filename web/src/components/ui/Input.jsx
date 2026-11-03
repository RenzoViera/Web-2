import { useId } from 'react';
import { cn } from '@/utils/cn';

/**
 * Campo de texto accesible. Compatible con `register()` de React Hook Form (ref como prop, React 19).
 * El error se muestra debajo con `aria-invalid` + `aria-describedby`.
 *
 * @param {{
 *   label: string,
 *   error?: string,
 *   hint?: string,
 *   ref?: import('react').Ref<HTMLInputElement>,
 * } & import('react').InputHTMLAttributes<HTMLInputElement>} props
 */
export function Input({ label, error, hint, id, required = false, type = 'text', className, ...rest }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-fg">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        type={type}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'h-10 w-full rounded-lg border bg-surface px-3 text-sm text-fg transition-colors placeholder:text-fg-subtle',
          'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-subtle',
          error ? 'border-danger' : 'border-border-strong hover:border-fg-subtle',
        )}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="text-xs text-fg-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="animate-fade-in text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
