import { cn } from '@/utils/cn';

const BASE =
  'relative inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap select-none ' +
  'transition duration-150 active:scale-[0.97] motion-reduce:active:scale-100 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100';

export const BUTTON_VARIANTS = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-active',
  secondary: 'border border-border-strong bg-surface text-fg hover:bg-surface-muted active:bg-border',
  ghost: 'text-fg-muted hover:bg-surface-muted hover:text-fg active:bg-border',
  danger: 'bg-danger text-fg-inverse hover:bg-danger-hover active:bg-danger-active',
};

export const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'size-10',
};

/**
 * @typedef {object} ButtonStyleProps
 * @property {keyof typeof BUTTON_VARIANTS} [variant]
 * @property {keyof typeof BUTTON_SIZES} [size]
 * @property {boolean} [fullWidth]
 * @property {string} [className]
 */

/**
 * Clases compartidas por Button y LinkButton (una sola fuente de estilos).
 * @param {ButtonStyleProps} [props]
 */
export const buttonClasses = ({ variant = 'primary', size = 'md', fullWidth = false, className } = {}) =>
  cn(BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], fullWidth && 'w-full', className);
