import { useMemo } from 'react';
import { useRouteError } from 'react-router';
import { buildErrorReport } from '@/utils/errorReport';
import { ErrorReportView } from './ErrorReportView';

/**
 * `errorElement` del router: errores al renderizar una ruta.
 * @param {{ variant?: 'page' | 'inline' }} props
 */
export function RouteErrorBoundary({ variant = 'inline' }) {
  const error = useRouteError();
  const report = useMemo(() => buildErrorReport(error), [error]);
  return <ErrorReportView report={report} variant={variant} />;
}
