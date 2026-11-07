import { useId } from 'react';
import { cn } from '@/utils/cn';

/**
 * @typedef {object} RadioCardOption
 * @property {string} value
 * @property {string} label
 * @property {string} [description]
 * @property {import('react').ReactNode} [icon]
 */

/**
 * Grupo de opciones excluyentes presentadas como tarjetas (radios nativos ocultos: teclado y lector de pantalla
 * funcionan igual que un grupo de radios). Compatible con `register()` de React Hook Form: se esparce en cada radio.
 *
 * @param {{
 *   legend: string,
 *   options: RadioCardOption[],
 *   error?: string,
 *   hint?: string,
 *   className?: string,
 * } & Partial<import('react-hook-form').UseFormRegisterReturn>} props
 */
export function RadioCardGroup({ legend, options, error, hint, className, ...inputProps }) {
  const baseId = useId();
  const legendId = `${baseId}-legend`;
  const hintId = hint ? `${baseId}-hint` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <fieldset
      role="radiogroup"
      aria-labelledby={legendId}
      aria-invalid={error ? true : undefined}
      className={cn('flex flex-col gap-1.5', className)}
    >
      <legend id={legendId} className="mb-1.5 text-sm font-medium text-fg">
        {legend}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border bg-surface p-4 transition-colors duration-150',
              'has-checked:border-primary has-checked:bg-primary-soft',
              'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
              error ? 'border-danger' : 'border-border-strong hover:border-fg-subtle',
            )}
          >
            <input
              type="radio"
              value={option.value}
              className="sr-only"
              aria-describedby={describedBy}
              {...inputProps}
            />
            {option.icon && <span className="mt-0.5 text-primary">{option.icon}</span>}
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-fg">{option.label}</span>
              {option.description && <span className="text-xs text-fg-muted">{option.description}</span>}
            </span>
          </label>
        ))}
      </div>
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
    </fieldset>
  );
}
