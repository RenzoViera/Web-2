import { useId } from 'react';
import { cn } from '@/utils/cn';

/**
 * @typedef {object} RadioCardOption
 * @property {string} value
 * @property {string} label
 * @property {string} [description]
 * @property {import('react').ReactNode} [icon]
 */

const VARIANTS = {
  /** Tarjetas en 2 columnas desde `sm` (rol al registrarse, tipo de lección). */
  cards: {
    legend: 'mb-1.5 text-sm font-medium text-fg',
    options: 'grid gap-3 sm:grid-cols-2',
    option: 'p-4',
    label: 'text-sm font-semibold text-fg',
  },
  /** Una opción por fila con el enunciado destacado (preguntas de un cuestionario). */
  list: {
    legend: 'mb-3 text-base font-semibold text-fg',
    options: 'flex flex-col gap-2',
    option: 'px-4 py-3',
    label: 'text-sm text-fg',
  },
};

/**
 * Grupo de opciones excluyentes presentadas como tarjetas (radios nativos ocultos: teclado y lector de pantalla
 * funcionan igual que un grupo de radios). Compatible con `register()` de React Hook Form: se esparce en cada radio.
 *
 * @param {{
 *   legend: string,
 *   options: RadioCardOption[],
 *   variant?: keyof typeof VARIANTS,
 *   error?: string,
 *   hint?: string,
 *   className?: string,
 * } & Partial<import('react-hook-form').UseFormRegisterReturn>} props
 */
export function RadioCardGroup({ legend, options, variant = 'cards', error, hint, className, ...inputProps }) {
  const baseId = useId();
  const legendId = `${baseId}-legend`;
  const hintId = hint ? `${baseId}-hint` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  const styles = VARIANTS[variant];

  return (
    <fieldset
      role="radiogroup"
      aria-labelledby={legendId}
      aria-invalid={error ? true : undefined}
      className={cn('flex flex-col gap-1.5', className)}
    >
      <legend id={legendId} className={styles.legend}>
        {legend}
      </legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border bg-surface transition-colors duration-150',
              'has-checked:border-primary has-checked:bg-primary-soft',
              'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
              styles.option,
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
              <span className={styles.label}>{option.label}</span>
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
