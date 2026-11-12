import { useId, useMemo, useRef, useState } from 'react';
import { ChevronDownIcon } from '@/components/icons';
import { useDismiss } from '@/hooks/useDismiss';
import { cn } from '@/utils/cn';

/**
 * @typedef {object} SelectOption
 * @property {string | number} value
 * @property {string} label
 */

/**
 * Desplegable personalizado accesible (C.37) con soporte completo de teclado y ARIA.
 *
 * @param {{
 *   label?: string,
 *   name?: string,
 *   value?: string | number,
 *   onChange?: (value: any) => void,
 *   options: Array<SelectOption | string>,
 *   placeholder?: string,
 *   error?: string,
 *   hint?: string,
 *   disabled?: boolean,
 *   required?: boolean,
 *   className?: string,
 * }} props
 */
export function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Selecciona una opción',
  error,
  hint,
  disabled = false,
  required = false,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const triggerRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const listboxRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const generatedId = useId();
  const selectId = name ?? generatedId;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;

  /** @type {SelectOption[]} */
  const normalizedOptions = useMemo(
    () =>
      options.map((opt) =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt,
      ),
    [options],
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useDismiss(
    containerRef,
    (reason) => {
      setIsOpen(false);
      setHighlightedIndex(-1);
      if (reason === 'escape') {
        triggerRef.current?.focus();
      }
    },
    isOpen,
  );

  const handleSelect = (optionValue) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  };

  /** @param {import('react').KeyboardEvent} event */
  const handleKeyDown = (event) => {
    if (disabled) return;

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        setIsOpen(true);
        const currentIndex = normalizedOptions.findIndex((opt) => opt.value === value);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % normalizedOptions.length);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + normalizedOptions.length) % normalizedOptions.length);
        break;
      }
      case 'Home': {
        event.preventDefault();
        setHighlightedIndex(0);
        break;
      }
      case 'End': {
        event.preventDefault();
        setHighlightedIndex(normalizedOptions.length - 1);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
          handleSelect(normalizedOptions[highlightedIndex].value);
        }
        break;
      }
      case 'Tab': {
        setIsOpen(false);
        break;
      }
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full text-left', className)}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-fg">
          {label}
          {required && <span className="ml-1 text-danger" aria-hidden="true">*</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            const currentIndex = normalizedOptions.findIndex((opt) => opt.value === value);
            setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
          }
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border bg-surface px-3 py-2 text-sm text-fg transition-colors select-none',
          'focus:border-primary focus:ring-2 focus:ring-ring/20 focus:outline-none',
          error
            ? 'border-danger focus:border-danger focus:ring-danger/20'
            : 'border-border hover:border-border-strong',
          disabled && 'cursor-not-allowed opacity-50 bg-surface-muted',
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-fg-subtle')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon
          className={cn(
            'size-4 text-fg-subtle transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${selectId}-opt-${highlightedIndex}` : undefined
          }
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface p-1 shadow-lg animate-slide-down focus:outline-none"
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-fg-subtle">No hay opciones disponibles</div>
          ) : (
            normalizedOptions.map((option, idx) => {
              const isSelected = option.value === value;
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={option.value}
                  id={`${selectId}-opt-${idx}`}
                  role="option"
                  tabIndex={0}
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(option.value);
                    }
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                    isHighlighted && 'bg-primary-soft text-primary',
                    isSelected && !isHighlighted && 'bg-surface-muted font-medium text-fg',
                    !isHighlighted && !isSelected && 'text-fg',
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <span className="ml-2 text-xs font-semibold text-primary">✓</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {error ? (
        <p id={errorId} className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1 text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
