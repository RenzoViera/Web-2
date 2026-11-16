import { useParams } from 'react-router';
import { CourseCover } from '@/components/cursos/CourseCover';
import { CourseStudents } from '@/components/instructor/CourseStudents';
import { LessonFunnel } from '@/components/instructor/LessonFunnel';
import { ArrowLeftIcon, AwardIcon, BookOpenIcon, EditIcon, TrendingUpIcon, UsersIcon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LinkButton } from '@/components/ui/LinkButton';
import { PageLoader } from '@/components/ui/PageLoader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatCard } from '@/components/ui/StatCard';
import { useFetch } from '@/hooks/useFetch';
import { instructorEditarCursoPath, PATHS } from '@/routes/paths';
import { instructorService } from '@/services/instructorService';
import { ESTADO_BADGES, nivelLabel } from '@/utils/cursos';
import { formatDate, pluralize } from '@/utils/format';

/** Panel de un curso del instructor: métricas, embudo por lección y estudiantes inscritos (RF-16). */
export default function CourseMetricsPage() {
  const { id } = useParams();
  const cursoId = Number(id);

  const { data, loading, error, refetch } = useFetch(
    ({ signal }) => instructorService.getCursoResumen(cursoId, { signal }),
    [cursoId],
  );

  if (loading) return <PageLoader />;

  if (error || !data) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <ErrorMessage message={error?.message} onRetry={refetch} />
      </div>
    );
  }

  const { curso, metricas, lecciones, mayorCaida } = data;
  const estado = ESTADO_BADGES[curso.estado];
  const editorPath = instructorEditarCursoPath(curso.id);

  return (
    <div className="mx-auto flex max-w-6xl animate-fade-in flex-col gap-8">
      <title>{`Panel: ${curso.titulo} · MiniAula`}</title>

      <div>
        <LinkButton to={PATHS.instructorCursos} variant="ghost" size="sm" className="mb-3 -ml-2">
          <ArrowLeftIcon className="size-4" />
          Volver a mis cursos
        </LinkButton>

        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="hidden size-20 shrink-0 overflow-hidden rounded-lg border border-border sm:block">
              <CourseCover imagenUrl={curso.imagenUrl} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={estado.variant}>{estado.label}</Badge>
                <Badge variant="neutral">{curso.categoria}</Badge>
                <Badge variant="neutral">{nivelLabel(curso.nivel)}</Badge>
              </div>
              <h1 className="mt-2 text-xl font-bold tracking-tight break-words text-fg sm:text-2xl">{curso.titulo}</h1>
              <p className="mt-1 text-xs text-fg-subtle">
                Creado el {formatDate(curso.createdAt)} · {pluralize(metricas.totalLecciones, 'lección', 'lecciones')}
              </p>
            </div>
          </div>
          <LinkButton to={editorPath} variant="secondary" className="self-start sm:self-auto">
            <EditIcon className="size-4" />
            Editar curso
          </LinkButton>
        </Card>
      </div>

      <section aria-label="Métricas clave" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Inscritos" value={metricas.totalInscritos} icon={<UsersIcon className="size-4 text-primary" />}>
          {pluralize(metricas.totalInscritos, 'estudiante', 'estudiantes')}
        </StatCard>
        <StatCard
          label="Completaron"
          value={metricas.totalCompletados}
          icon={<AwardIcon className="size-4 text-success" />}
        >
          {metricas.tasaCompletitud}% de los inscritos
        </StatCard>
        <StatCard
          label="Progreso promedio"
          value={`${metricas.promedioProgreso}%`}
          icon={<TrendingUpIcon className="size-4 text-primary" />}
        >
          <ProgressBar value={metricas.promedioProgreso} label="Progreso promedio de los estudiantes" size="sm" />
        </StatCard>
        <StatCard
          label="Nota promedio"
          value={metricas.notaPromedio ?? '—'}
          icon={<BookOpenIcon className="size-4 text-primary" />}
        >
          {metricas.notaPromedio === null ? 'nadie rindió aún' : 'mejor nota en cuestionarios'}
        </StatCard>
      </section>

      <section aria-labelledby="seccion-lecciones" className="flex flex-col gap-4">
        <div>
          <h2 id="seccion-lecciones" className="text-lg font-bold text-fg sm:text-xl">
            Estudiantes que llegaron a cada lección
          </h2>
          <p className="mt-0.5 text-sm text-fg-muted">
            Una lección se alcanza al completar todas las anteriores. Detecta dónde se detienen tus estudiantes.
          </p>
        </div>

        {lecciones.length === 0 ? (
          <EmptyState
            title="Este curso aún no tiene lecciones"
            description="Agrega lecciones y cuestionarios en el editor para empezar a ver el avance."
            action={
              <LinkButton to={editorPath} size="sm">
                Ir al editor
              </LinkButton>
            }
          />
        ) : metricas.totalInscritos === 0 ? (
          <EmptyState
            icon={<UsersIcon className="size-10" />}
            title="Aún no hay inscritos"
            description="Cuando los estudiantes se inscriban vas a ver aquí su avance por lección."
          />
        ) : (
          <LessonFunnel lecciones={lecciones} totalInscritos={metricas.totalInscritos} mayorCaida={mayorCaida} />
        )}
      </section>

      {metricas.totalInscritos > 0 && (
        <CourseStudents
          cursoId={curso.id}
          totalInscritos={metricas.totalInscritos}
          totalCompletados={metricas.totalCompletados}
        />
      )}
    </div>
  );
}

