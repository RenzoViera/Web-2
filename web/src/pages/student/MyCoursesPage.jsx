import { useState } from 'react';
import { BookOpenIcon } from '@/components/icons';
import { EnrolledCourseCard } from '@/components/student/EnrolledCourseCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LinkButton } from '@/components/ui/LinkButton';
import { PageLoader } from '@/components/ui/PageLoader';
import { Pagination } from '@/components/ui/Pagination';
import { useFetch } from '@/hooks/useFetch';
import { PATHS } from '@/routes/paths';
import { inscripcionesService } from '@/services/inscripcionesService';

const LIMIT = 9;

/** Cursos en los que está inscrito el estudiante, con su avance y acceso a la siguiente lección. */
export default function MyCoursesPage() {
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useFetch(
    ({ signal }) => inscripcionesService.getMisInscripciones({ page, limit: LIMIT }, { signal }),
    [page],
  );

  return (
    <div className="mx-auto flex max-w-6xl animate-fade-in flex-col gap-6">
      <title>Mis cursos · MiniAula</title>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Mis cursos</h1>
        <p className="mt-1 text-sm text-fg-muted">Retoma tus cursos donde los dejaste.</p>
      </header>

      {loading && <PageLoader />}

      {!loading && error && (
        <ErrorMessage title="No se pudieron cargar tus cursos" message={error.message} onRetry={refetch} />
      )}

      {!loading && !error && data && (
        <>
          {data.data.length === 0 ? (
            <EmptyState
              icon={<BookOpenIcon className="size-10" />}
              title="Aún no te inscribiste en ningún curso"
              description="Explora el catálogo y elige tu primer curso."
              action={
                <LinkButton to={PATHS.catalogo} size="sm">
                  Explorar catálogo
                </LinkButton>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((inscripcion) => (
                <EnrolledCourseCard key={inscripcion.id} inscripcion={inscripcion} />
              ))}
            </div>
          )}
          <Pagination meta={data.meta} onPageChange={setPage} itemLabel={['curso', 'cursos']} />
        </>
      )}
    </div>
  );
}
