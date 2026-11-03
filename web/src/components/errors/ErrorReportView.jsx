import { AlertTriangleIcon, CloseIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { cn } from '@/utils/cn';
import { formatErrorReport } from '@/utils/errorReport';

const CONTAINER = {
  page: 'flex min-h-dvh items-center justify-center bg-bg p-4',
  inline: 'flex justify-center py-8',
  notice: 'fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 sm:justify-end',
};

const COPY_LABEL = {
  idle: 'Copiar detalle',
  copied: 'Copiado',
  error: 'No se pudo copiar',
};

/**
 * Aviso de error inesperado en 2 niveles: mensaje para el usuario + detalle técnico desplegable.
 * @param {{
 *   report: import('@/utils/errorReport').ErrorReport,
 *   variant?: keyof typeof CONTAINER,
 *   onClose?: () => void,
 * }} props `page`: pantalla completa · `inline`: dentro del layout · `notice`: flotante sin tumbar la pantalla.
 */
export function ErrorReportView({ report, variant = 'inline', onClose }) {
  const { copy, status } = useCopyToClipboard();
  const detail = formatErrorReport(report);

  return (
    <div className={CONTAINER[variant]}>
      <div
        role="alert"
        className={cn(
          'w-full max-w-lg animate-slide-up rounded-xl border border-border bg-surface p-5',
          variant === 'notice' ? 'shadow-xl' : 'shadow-sm',
        )}
      >
        <div className="flex items-start gap-3">
          <AlertTriangleIcon className="mt-0.5 size-6 text-danger" />
          <div className="flex-1">
            <h2 className="font-semibold text-fg">Ocurrió un error inesperado</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Copia el detalle y envíaselo al administrador del sistema. Luego puedes recargar la página.
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar aviso" className="-mr-2 -mt-1 px-2">
              <CloseIcon className="size-4" />
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => copy(detail)}>
            {COPY_LABEL[status]}
          </Button>
          <Button size="sm" onClick={() => window.location.reload()}>
            Recargar
          </Button>
        </div>

        <details className="group mt-4 rounded-lg border border-border bg-surface-muted">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg">
            Detalle técnico
          </summary>
          <pre className="max-h-64 overflow-auto border-t border-border px-3 py-2 text-xs whitespace-pre-wrap break-words text-fg-muted">
            {detail}
          </pre>
        </details>
      </div>
    </div>
  );
}
