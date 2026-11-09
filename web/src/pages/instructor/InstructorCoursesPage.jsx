import { useState } from 'react';
import { useNavigate } from 'react-router';
import { BookOpenIcon, PlusIcon, PresentationIcon, UsersIcon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LinkButton } from '@/components/ui/LinkButton';
import { PageLoader } from '@/components/ui/PageLoader';
import { useFetch } from '@/hooks/useFetch';
import { instructorEditarCursoPath, PATHS } from '@/routes/paths';
import { cursosService } from '@/services/cursosService';

const ESTADO_BADGES = {
  borrador: { label: 'Borrador', variant: 'neutral' },
  publicado: { label: 'Publicado', variant: 'success' },
  archivado: { label: 'Archivado', variant: 'warning' },
};

const NIVEL_LABELS = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export default function InstructorCoursesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useFetch(
    ({ signal }) => cursosService.getInstructorCursos({ page, limit: 9 }, { signal }),
    [page],
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
      <title>Mis cursos · Instructor · MiniAula</title>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Cursos del instructor
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Gestiona tus cursos, lecciones y publica contenidos para tus estudiantes.
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

      {cursos.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            title="Aún no has creado ningún curso"
            description="Comienza creando tu primer curso con lecciones y cuestionarios para tus estudiantes."
            actionLabel="Crear mi primer curso"
            onAction={() => navigate(PATHS.instructorNuevoCurso)}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cursos.map((curso) => {
              const estadoInfo = ESTADO_BADGES[curso.estado] ?? {
                label: curso.estado,
                variant: 'neutral',
              };

              return (
                <Card
                  key={curso.id}
                  className="flex flex-col justify-between overflow-hidden border border-border p-0 transition-shadow hover:shadow-md"
                >
                  <div>
                    {curso.imagenUrl ? (
                      <div className="aspect-video w-full overflow-hidden bg-surface-muted">
                        <img
                          src={curso.imagenUrl}
                          alt={curso.titulo}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center bg-surface-muted text-fg-subtle">
                        <PresentationIcon className="size-12 opacity-40" />
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={/** @type {any} */ (estadoInfo.variant)}>
                          {estadoInfo.label}
                        </Badge>
                        <Badge variant="neutral">{curso.categoria}</Badge>
                        <Badge variant="neutral">
                          {NIVEL_LABELS[curso.nivel] ?? curso.nivel}
                        </Badge>
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
                          {curso.totalLecciones}{' '}
                          {curso.totalLecciones === 1 ? 'lección' : 'lecciones'}
                        </span>
                        <span className="flex items-center gap-1">
                          <UsersIcon className="size-4" />
                          {curso.totalInscritos}{' '}
                          {curso.totalInscritos === 1 ? 'inscrito' : 'inscritos'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border bg-surface-muted/50 p-4">
                    <LinkButton
                      to={instructorEditarCursoPath(curso.id)}
                      variant="secondary"
                      className="w-full justify-center"
                    >
                      Editar curso
                    </LinkButton>
                  </div>
                </Card>
              );
            })}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-fg-muted">
                Página {meta.page} de {meta.totalPages} ({meta.total} cursos en total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
