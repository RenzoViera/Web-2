import { useState } from 'react';
import { InstructorCourseCard } from '@/components/instructor/InstructorCourseCard';
import { InstructorSummary } from '@/components/instructor/InstructorSummary';
import { PlusIcon } from '@/components/icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LinkButton } from '@/components/ui/LinkButton';
import { PageLoader } from '@/components/ui/PageLoader';
import { Pagination } from '@/components/ui/Pagination';
import { useFetch } from '@/hooks/useFetch';
import { PATHS } from '@/routes/paths';
import { cursosService } from '@/services/cursosService';

const COURSES_PER_PAGE = 9;

/** Panel del instructor: resumen global y sus cursos (cada sección carga por su cuenta, REGLAS C.27). */
export default function InstructorCoursesPage() {
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useFetch(
    ({ signal }) => cursosService.getInstructorCursos({ page, limit: COURSES_PER_PAGE }, { signal }),
    [page],
  );

  return (
    <div className="mx-auto flex max-w-6xl animate-fade-in flex-col gap-6">
      <title>Panel del instructor · MiniAula</title>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Panel del instructor</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Gestiona tus cursos, lecciones y cuestionarios, y sigue el avance de tus estudiantes.
          </p>
        </div>
        <LinkButton to={PATHS.instructorNuevoCurso} className="self-start sm:self-auto">
          <PlusIcon className="size-4" />
          Nuevo curso
        </LinkButton>
      </div>

      <InstructorSummary />

      <section aria-label="Mis cursos" className="flex flex-col gap-4">
        {loading ? (
          <PageLoader />
        ) : error || !data ? (
          <ErrorMessage title="No se pudieron cargar tus cursos" message={error?.message} onRetry={refetch} />
        ) : data.data.length === 0 ? (
          <EmptyState
            title="Aún no creaste ningún curso"
            description="Crea tu primer curso y agrégale lecciones y cuestionarios para tus estudiantes."
            action={
              <LinkButton to={PATHS.instructorNuevoCurso} size="sm">
                Crear mi primer curso
              </LinkButton>
            }
          />
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((curso) => (
                <li key={curso.id} className="flex">
                  <InstructorCourseCard curso={curso} />
                </li>
              ))}
            </ul>
            <Pagination meta={data.meta} onPageChange={setPage} itemLabel={['curso', 'cursos']} />
          </>
        )}
      </section>
    </div>
  );
}
