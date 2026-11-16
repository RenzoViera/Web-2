import { AwardIcon, BookOpenIcon, TrendingUpIcon, UsersIcon } from '@/components/icons';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { useFetch } from '@/hooks/useFetch';
import { instructorService } from '@/services/instructorService';
import { pluralize } from '@/utils/format';

/**
 * Totales de todos los cursos del instructor. Sección independiente: carga y falla por su cuenta sin bloquear el
 * listado de cursos (REGLAS C.27).
 */
export function InstructorSummary() {
  const { data, loading, error, refetch } = useFetch(({ signal }) => instructorService.getResumenGlobal({ signal }));

  if (loading) {
    return (
      <div className="grid min-h-28 place-items-center">
        <Spinner label="Cargando resumen…" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorMessage title="No se pudo cargar el resumen" message={error?.message} onRetry={refetch} />;
  }

  return (
    <section aria-label="Resumen general" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard label="Cursos" value={data.cursos.total} icon={<BookOpenIcon className="size-4 text-primary" />}>
        {data.cursos.publicados} publicados · {data.cursos.borradores} en borrador
      </StatCard>
      <StatCard label="Inscritos" value={data.totalInscritos} icon={<UsersIcon className="size-4 text-primary" />}>
        {pluralize(data.totalInscritos, 'inscripción', 'inscripciones')}
      </StatCard>
      <StatCard label="Completaron" value={data.totalCompletados} icon={<AwardIcon className="size-4 text-success" />}>
        cursos terminados
      </StatCard>
      <StatCard
        label="Finalización"
        value={`${data.tasaCompletitud}%`}
        icon={<TrendingUpIcon className="size-4 text-primary" />}
      >
        de las inscripciones
      </StatCard>
    </section>
  );
}
