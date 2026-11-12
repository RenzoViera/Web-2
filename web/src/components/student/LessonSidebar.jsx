import { Link } from 'react-router';
import { BookOpenIcon, CheckCircleIcon, ListChecksIcon, LockIcon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Spinner } from '@/components/ui/Spinner';
import { leccionPath } from '@/routes/paths';
import { cn } from '@/utils/cn';
import { ESTADO_BADGES } from '@/utils/cursos';

/**
 * Temario lateral del curso con estado secuencial de cada lección (completada / desbloqueada / bloqueada).
 * @param {{
 *   cursoId: number,
 *   activeLeccionId: number,
 *   progreso: import('@/services/progresoService').CursoProgreso | null,
 *   loading: boolean,
 *   error: Error | null,
 *   onRetry: () => void,
 * }} props
 */
export function LessonSidebar({ cursoId, activeLeccionId, progreso, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border border-border bg-surface p-6">
        <Spinner label="Cargando temario…" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage title="No se pudo cargar el temario" message={error.message} onRetry={onRetry} />;
  }

  if (!progreso) return null;

  const estadoCurso = progreso.curso.estado === 'publicado' ? null : ESTADO_BADGES[progreso.curso.estado];

  return (
    <aside
      aria-label="Temario del curso"
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {progreso.completado && <Badge variant="success">Curso completado</Badge>}
          {estadoCurso && <Badge variant={estadoCurso.variant}>{estadoCurso.label}</Badge>}
        </div>
        <h2 className="text-base font-semibold text-fg">{progreso.curso.titulo}</h2>
        <ProgressBar value={progreso.porcentaje} size="sm" label={`Avance en ${progreso.curso.titulo}`} />
        <p className="text-xs text-fg-muted">
          {progreso.leccionesCompletadas} de {progreso.totalLecciones}{' '}
          {progreso.totalLecciones === 1 ? 'lección' : 'lecciones'} · {progreso.porcentaje} %
        </p>
      </div>

      {progreso.lecciones.length === 0 ? (
        <p className="text-sm text-fg-subtle">Este curso aún no tiene lecciones.</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {progreso.lecciones.map((item) => {
            const esActual = item.id === activeLeccionId;
            const esCuestionario = item.tipo === 'cuestionario';
            const TipoIcon = esCuestionario ? ListChecksIcon : BookOpenIcon;

            const content = (
              <>
                <span
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold',
                    item.completada
                      ? 'bg-success-soft text-success'
                      : esActual
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-muted text-fg-muted',
                  )}
                >
                  {item.completada ? <CheckCircleIcon className="size-4" /> : item.orden}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{item.titulo}</span>
                  <span className="flex items-center gap-1 text-xs text-fg-subtle">
                    <TipoIcon className="size-3.5" />
                    {esCuestionario ? 'Cuestionario' : 'Contenido'}
                  </span>
                </span>

                {!item.desbloqueada && (
                  <>
                    <LockIcon className="size-4 text-fg-subtle" />
                    <span className="sr-only">Bloqueada</span>
                  </>
                )}
              </>
            );

            return (
              <li key={item.id}>
                {item.desbloqueada ? (
                  <Link
                    to={leccionPath(cursoId, item.id)}
                    aria-current={esActual ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                      esActual
                        ? 'border-primary/30 bg-primary-soft font-medium text-fg'
                        : 'border-transparent text-fg hover:bg-surface-muted',
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-fg-subtle opacity-65"
                  >
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
