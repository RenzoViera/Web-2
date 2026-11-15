import { useState } from 'react';
import { CourseCover } from '@/components/cursos/CourseCover';
import { AwardIcon, BarChartIcon, BookOpenIcon, EditIcon, PlusIcon, TrendingUpIcon, UsersIcon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LinkButton } from '@/components/ui/LinkButton';
import { PageLoader } from '@/components/ui/PageLoader';
import { Pagination } from '@/components/ui/Pagination';
import { useFetch } from '@/hooks/useFetch';
import { instructorCursoResumenPath, instructorEditarCursoPath, PATHS } from '@/routes/paths';
import { cursosService } from '@/services/cursosService';
import { instructorService } from '@/services/instructorService';
import { ESTADO_BADGES, nivelLabel } from '@/utils/cursos';
import { pluralize } from '@/utils/format';

export default function InstructorCoursesPage() {
  const [page, setPage] = useState(1);

  // Cursos paginados del instructor
  const { data, loading, error, refetch } = useFetch(
    ({ signal }) => cursosService.getInstructorCursos({ page, limit: 9 }, { signal }),
    [page],
  );

  // Resumen global independiente (REGLAS C.27)
  const { data: resumen } = useFetch(
    ({ signal }) => instructorService.getResumenGlobal({ signal }),
    [],
  );

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <ErrorMessage
          message={error.message || 'Error al cargar tus cursos'}
          onRetry={refetch}
        />
      </div>
    );
  }

  const cursos = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 animate-fade-in">
      <title>Panel del instructor · MiniAula</title>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Panel del instructor
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Gestiona tus cursos, lecciones, cuestionarios y monitorea el avance de tus estudiantes.
          </p>
        </div>
        <LinkButton
          to={PATHS.instructorNuevoCurso}
          variant="primary"
          className="self-start sm:self-auto"
        >
          <PlusIcon className="size-4" />
          Nuevo curso
        </LinkButton>
      </div>

      {resumen && (
        <section aria-label="Resumen general" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="flex flex-col gap-1 p-4">
            <div className="flex items-center justify-between text-fg-subtle">
              <span className="text-xs font-medium uppercase tracking-wider">Cursos</span>
              <BookOpenIcon className="size-4 text-primary" />
            </div>
            <span className="text-2xl font-bold text-fg">{resumen.cursos.total}</span>
            <span className="text-xs text-fg-muted">
              {resumen.cursos.publicados} pub · {resumen.cursos.borradores} borrador
            </span>
          </Card>

          <Card className="flex flex-col gap-1 p-4">
            <div className="flex items-center justify-between text-fg-subtle">
              <span className="text-xs font-medium uppercase tracking-wider">Inscritos</span>
              <UsersIcon className="size-4 text-primary" />
            </div>
            <span className="text-2xl font-bold text-fg">{resumen.totalInscritos}</span>
            <span className="text-xs text-fg-muted">
              {pluralize(resumen.totalInscritos, 'estudiante', 'estudiantes')}
            </span>
          </Card>

          <Card className="flex flex-col gap-1 p-4">
            <div className="flex items-center justify-between text-fg-subtle">
              <span className="text-xs font-medium uppercase tracking-wider">Completados</span>
              <AwardIcon className="size-4 text-success" />
            </div>
            <span className="text-2xl font-bold text-fg">{resumen.totalCompletados}</span>
            <span className="text-xs text-fg-muted">finalizaciones de curso</span>
          </Card>

          <Card className="flex flex-col gap-1 p-4">
            <div className="flex items-center justify-between text-fg-subtle">
              <span className="text-xs font-medium uppercase tracking-wider">Finalización</span>
              <TrendingUpIcon className="size-4 text-primary" />
            </div>
            <span className="text-2xl font-bold text-fg">{resumen.tasaCompletitud}%</span>
            <span className="text-xs text-fg-muted">tasa promedio</span>
          </Card>
        </section>
      )}

      {cursos.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            title="Aún no has creado ningún curso"
            description="Comienza creando tu primer curso con lecciones y cuestionarios para tus estudiantes."
            action={
              <LinkButton to={PATHS.instructorNuevoCurso} size="sm">
                Crear mi primer curso
              </LinkButton>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cursos.map((curso) => {
              const estadoInfo = ESTADO_BADGES[curso.estado];

              return (
                <Card
                  key={curso.id}
                  className="flex flex-col justify-between overflow-hidden border border-border p-0 transition-shadow hover:shadow-md"
                >
                  <div>
                    <CourseCover imagenUrl={curso.imagenUrl} />

                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
                        <Badge variant="neutral">{curso.categoria}</Badge>
                        <Badge variant="neutral">{nivelLabel(curso.nivel)}</Badge>
                      </div>

                      <h2 className="mt-3 line-clamp-2 text-lg font-semibold text-fg">
                        {curso.titulo}
                      </h2>

                      {curso.descripcion && (
                        <p className="mt-2 line-clamp-2 text-sm text-fg-muted">
                          {curso.descripcion}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-4 text-xs text-fg-subtle">
                        <span className="flex items-center gap-1">
                          <BookOpenIcon className="size-4" />
                          {pluralize(curso.totalLecciones, 'lección', 'lecciones')}
                        </span>
                        <span className="flex items-center gap-1">
                          <UsersIcon className="size-4" />
                          {pluralize(curso.totalInscritos, 'inscrito', 'inscritos')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-border bg-surface-muted/50 p-4">
                    <LinkButton
                      to={instructorCursoResumenPath(curso.id)}
                      variant="secondary"
                      className="w-full justify-center text-xs sm:text-sm"
                    >
                      <BarChartIcon className="size-4" />
                      Métricas
                    </LinkButton>
                    <LinkButton
                      to={instructorEditarCursoPath(curso.id)}
                      variant="primary"
                      className="w-full justify-center text-xs sm:text-sm"
                    >
                      <EditIcon className="size-4" />
                      Editar
                    </LinkButton>
                  </div>
                </Card>
              );
            })}
          </div>

          {meta && <Pagination meta={meta} onPageChange={setPage} itemLabel={['curso', 'cursos']} className="mt-4" />}
        </>
      )}
    </div>
  );
}
