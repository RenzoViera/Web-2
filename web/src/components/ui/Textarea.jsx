import { useId } from 'react';
import { cn } from '@/utils/cn';

/**
 * Área de texto accesible, misma API que `Input`. Compatible con `register()` de React Hook Form.
 * El error se muestra debajo con `aria-invalid` + `aria-describedby`.
 *
 * @param {{
 *   label: string,
 *   error?: string,
 *   hint?: string,
 *   ref?: import('react').Ref<HTMLTextAreaElement>,
 * } & import('react').TextareaHTMLAttributes<HTMLTextAreaElement>} props
 */
export function Textarea({ label, error, hint, id, required = false, rows = 4, className, ...rest }) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={textareaId} className="text-sm font-medium text-fg">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full resize-y rounded-lg border bg-surface px-3 py-2 text-sm text-fg transition-colors placeholder:text-fg-subtle',
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
