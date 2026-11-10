import { useEffect, useEffectEvent, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '@/components/icons';
import { cn } from '@/utils/cn';
import { Button } from './Button';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SIZES = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

/**
 * Modal único del proyecto (REGLAS C.11 y C.40): portal al body, foco atrapado, Escape y clic en el fondo
 * cierran, el foco vuelve al elemento que lo abrió y el scroll de la página queda bloqueado mientras está abierto.
 *
 * @param {{
 *   title: string,
 *   description?: string,
 *   onClose: () => void,
 *   closeDisabled?: boolean,
 *   size?: keyof typeof SIZES,
 *   footer?: import('react').ReactNode,
 *   children: import('react').ReactNode,
 * }} props
 *   `closeDisabled`: impide cerrar (p. ej. mientras se guarda).
 */
export function Modal({ title, description, onClose, closeDisabled = false, size = 'md', footer, children }) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descId = `${baseId}-desc`;
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const requestClose = useEffectEvent(() => {
    if (!closeDisabled) onClose();
  });

  useEffect(() => {
    const previouslyFocused = /** @type {HTMLElement | null} */ (document.activeElement);
    const panel = panelRef.current;
    const first = panel?.querySelector('[data-autofocus]') ?? panel?.querySelector(FOCUSABLE);
    /** @type {HTMLElement} */ (first ?? panel)?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    /** @param {KeyboardEvent} event */
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        requestClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) return;
      const firstItem = /** @type {HTMLElement} */ (items[0]);
      const lastItem = /** @type {HTMLElement} */ (items.at(-1));
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-fg/40 p-0 backdrop-blur-xs animate-fade-in sm:items-center sm:p-4"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-border bg-surface shadow-xl animate-slide-up focus:outline-none sm:rounded-2xl',
          SIZES[size],
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-fg">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-0.5 text-sm text-fg-muted">
                {description}
              </p>
            )}
          </div>
          <Button variant="ghost" size="iconSm" aria-label="Cerrar" disabled={closeDisabled} onClick={onClose}>
            <CloseIcon className="size-4" />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-3 border-t border-border px-5 py-4">{footer}</footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
