import { useEffect, useState } from 'react';
import { buildErrorReport, shouldIgnoreError } from '@/utils/errorReport';
import { ErrorReportView } from './ErrorReportView';

/**
 * Captura errores fuera del render (handlers, timers, promesas sin catch)
 * y los muestra como aviso flotante sin tumbar la pantalla.
 */
export function GlobalErrorListener() {
  const [report, setReport] = useState(/** @type {import('@/utils/errorReport').ErrorReport | null} */ (null));

  useEffect(() => {
    /** @param {ErrorEvent} event */
    const handleError = (event) => {
      const error = event.error ?? event.message;
      if (shouldIgnoreError(error, { filename: event.filename })) return;
      setReport(buildErrorReport(error));
    };
    /** @param {PromiseRejectionEvent} event */
    const handleRejection = (event) => {
      if (shouldIgnoreError(event.reason)) return;
      setReport(buildErrorReport(event.reason));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (!report) return null;
  return <ErrorReportView report={report} variant="notice" onClose={() => setReport(null)} />;
}
