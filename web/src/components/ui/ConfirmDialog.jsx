import { useEffect, useId, useRef } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Cuadro de diálogo de confirmación accesible (C.11).
 *
 * @param {{
 *   open: boolean,
 *   title: string,
 *   description?: string,
 *   confirmText?: string,
 *   cancelText?: string,
 *   variant?: 'danger' | 'primary',
 *   loading?: boolean,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const descId = `${dialogId}-desc`;
  const cancelBtnRef = useRef(/** @type {HTMLButtonElement | null} */ (null));

  useEffect(() => {
    if (!open) return undefined;

    cancelBtnRef.current?.focus();

    /** @param {KeyboardEvent} event */
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) {
        event.stopPropagation();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-fg/40 backdrop-blur-xs animate-fade-in"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl animate-slide-up">
        <h3 id={titleId} className="text-lg font-semibold text-fg">
          {title}
        </h3>
        {description && (
          <p id={descId} className="mt-2 text-sm text-fg-muted">
            {description}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            ref={cancelBtnRef}
            type="button"
            variant="outline"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
