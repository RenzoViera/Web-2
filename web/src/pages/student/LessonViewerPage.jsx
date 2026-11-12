import { useParams } from 'react-router';
import { ApiError } from '@/api/ApiError';
import { ArrowLeftIcon, ArrowRightIcon, BookOpenIcon, CheckCircleIcon, LockIcon } from '@/components/icons';
import { LessonQuizPreview } from '@/components/student/LessonQuizPreview';
import { LessonSidebar } from '@/components/student/LessonSidebar';
import { LessonVideo } from '@/components/student/LessonVideo';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LinkButton } from '@/components/ui/LinkButton';
import { PageLoader } from '@/components/ui/PageLoader';
import { useProgreso } from '@/hooks/useProgreso';
import { cursoDetallePath, leccionPath, PATHS } from '@/routes/paths';
import { formatDate } from '@/utils/format';

/** @param {string | undefined} raw */
const parsePositiveId = (raw) => {
  const num = Number(raw);
  return Number.isInteger(num) && num > 0 ? num : null;
};

/**
 * Vista de lección del estudiante inscrito: barra de avance lateral, desbloqueo secuencial (RN-01),
 * contenido/video y botón para marcar como completada (RF-10, RF-12).
 */
export default function LessonViewerPage() {
  const { cursoId: rawCursoId, leccionId: rawLeccionId } = useParams();
  const cursoId = parsePositiveId(rawCursoId);
  const leccionId = parsePositiveId(rawLeccionId);

  const {
    progreso,
    progresoLoading,
    progresoError,
    refetchProgreso,
    leccion,
    leccionLoading,
    leccionError,
    refetchLeccion,
    marcarCompletada,
  } = useProgreso(cursoId, leccionId);

  if (!cursoId || !leccionId) {
    return (
      <div className="mx-auto max-w-4xl">
        <ErrorMessage
          title="Dirección de lección inválida"
          message="Verifica el enlace desde Mis cursos e intenta nuevamente."
        />
      </div>
    );
  }

  const leccionApiError = leccionError instanceof ApiError ? leccionError : null;
  const progresoApiError = progresoError instanceof ApiError ? progresoError : null;
  const notEnrolled = leccionApiError?.code === 'NOT_ENROLLED' || progresoApiError?.code === 'NOT_ENROLLED';

  if (notEnrolled) {
    return (
      <div className="mx-auto max-w-3xl animate-fade-in">
        <title>Acceso restringido · MiniAula</title>
        <EmptyState
          icon={<LockIcon className="size-10" />}
          title="No estás inscrito en este curso"
          description="Inscríbete desde el detalle del curso para acceder a sus lecciones."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <LinkButton to={cursoDetallePath(cursoId)} size="sm">
                Ir al detalle del curso
              </LinkButton>
              <LinkButton to={PATHS.misCursos} variant="secondary" size="sm">
                Mis cursos
              </LinkButton>
            </div>
          }
        />
      </div>
    );
  }

  const mismatchCurso = Boolean(leccion && progreso && leccion.cursoId !== progreso.curso.id);
  const totalLecciones = progreso?.totalLecciones ?? null;

  const siguienteItem =
    leccion?.siguienteLeccionId && progreso
      ? progreso.lecciones.find((item) => item.id === leccion.siguienteLeccionId) ?? null
      : null;

  const puedeIrSiguiente = Boolean(
    leccion?.siguienteLeccionId && (leccion.completada || siguienteItem?.desbloqueada),
  );

  return (
    <div className="mx-auto flex max-w-6xl animate-fade-in flex-col gap-6">
      <title>{leccion ? `${leccion.titulo} · MiniAula` : 'Lección · MiniAula'}</title>

      <nav aria-label="Navegación de regreso" className="flex flex-wrap items-center justify-between gap-2">
        <LinkButton to={PATHS.misCursos} variant="ghost" size="sm">
          <ArrowLeftIcon className="size-4" />
          Volver a Mis cursos
        </LinkButton>
        <LinkButton to={cursoDetallePath(cursoId)} variant="ghost" size="sm">
          Ver detalle del curso
        </LinkButton>
      </nav>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <div className="order-2 lg:sticky lg:top-24 lg:order-1">
          <LessonSidebar
            cursoId={cursoId}
            activeLeccionId={leccionId}
            progreso={progreso}
            loading={progresoLoading}
            error={progresoError}
            onRetry={refetchProgreso}
          />
        </div>

        <section className="order-1 min-w-0 lg:order-2">
          {leccionLoading && <PageLoader />}

          {!leccionLoading && mismatchCurso && leccion && (
            <ErrorMessage
              title="La lección no corresponde a este curso"
              message="Puedes abrirla dentro de su curso correspondiente o volver a Mis cursos."
            />
          )}

          {!leccionLoading && leccionApiError?.code === 'LESSON_LOCKED' && (
            <Card className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-surface-muted text-fg-muted">
                <LockIcon className="size-7" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h1 className="text-xl font-bold text-fg">Lección bloqueada</h1>
                <p className="text-sm text-fg-muted">{leccionApiError.message}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {progreso?.siguienteLeccionId && progreso.siguienteLeccionId !== leccionId ? (
                  <LinkButton to={leccionPath(cursoId, progreso.siguienteLeccionId)}>
                    Ir a la lección actual
                  </LinkButton>
                ) : (
                  <LinkButton to={PATHS.misCursos}>Volver a Mis cursos</LinkButton>
                )}
              </div>
            </Card>
          )}

          {!leccionLoading && leccionError && leccionApiError?.code !== 'LESSON_LOCKED' && (
            <ErrorMessage
              title="No se pudo cargar la lección"
              message={leccionError.message}
              onRetry={refetchLeccion}
            />
          )}

          {!leccionLoading && !leccionError && !mismatchCurso && leccion && (
            <div className="flex flex-col gap-6">
              <Card as="article" className="flex flex-col gap-6 p-5 sm:p-8">
                <header className="flex flex-col gap-3 border-b border-border pb-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium tracking-wide text-fg-subtle uppercase">
                      Lección {leccion.orden}
                      {totalLecciones ? ` de ${totalLecciones}` : ''}
                    </span>
                    <Badge variant={leccion.tipo === 'cuestionario' ? 'primary' : 'neutral'}>
                      {leccion.tipo === 'cuestionario' ? 'Cuestionario' : 'Contenido'}
                    </Badge>
                    {leccion.completada && <Badge variant="success">Completada</Badge>}
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{leccion.titulo}</h1>
                </header>

                {leccion.tipo === 'cuestionario' ? (
                  <LessonQuizPreview leccion={leccion} />
                ) : (
                  <>
                    {leccion.videoUrl && <LessonVideo videoUrl={leccion.videoUrl} titulo={leccion.titulo} />}

                    {leccion.contenido ? (
                      <div className="text-base leading-relaxed whitespace-pre-line text-fg">{leccion.contenido}</div>
                    ) : (
                      !leccion.videoUrl && (
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-fg-muted">
                          <BookOpenIcon className="size-4" />
                          <span>Esta lección aún no tiene texto ni video adjunto.</span>
                        </div>
                      )
                    )}

                    <footer className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                      {leccion.completada ? (
                        <p className="flex items-center gap-2 text-sm font-medium text-fg">
                          <CheckCircleIcon className="size-5 text-success" />
                          <span>
                            Lección completada
                            {leccion.fechaCompletada ? ` el ${formatDate(leccion.fechaCompletada)}` : ''}
                          </span>
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-fg-muted">
                            Marca esta lección como completada para avanzar en el curso.
                          </p>
                          <Button onClick={marcarCompletada}>Marcar como completada</Button>
                        </>
                      )}
                    </footer>
                  </>
                )}
              </Card>

              <nav
                aria-label="Navegación entre lecciones"
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                {leccion.anteriorLeccionId ? (
                  <LinkButton to={leccionPath(cursoId, leccion.anteriorLeccionId)} variant="secondary">
                    <ArrowLeftIcon className="size-4" />
                    Lección anterior
                  </LinkButton>
                ) : (
                  <span />
                )}

                {leccion.siguienteLeccionId &&
                  (puedeIrSiguiente ? (
                    <LinkButton to={leccionPath(cursoId, leccion.siguienteLeccionId)}>
                      Siguiente lección
                      <ArrowRightIcon className="size-4" />
                    </LinkButton>
                  ) : (
                    <p className="flex items-center gap-1.5 text-sm text-fg-subtle sm:justify-end">
                      <LockIcon className="size-4" />
                      <span>Completa esta lección para habilitar la siguiente</span>
                    </p>
                  ))}
              </nav>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
