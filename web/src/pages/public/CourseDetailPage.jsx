import { useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { isExpectedApiError } from '@/api/ApiError';
import { CourseCover } from '@/components/cursos/CourseCover';
import { CourseSyllabus } from '@/components/cursos/CourseSyllabus';
import { ArrowLeftIcon, CheckCircleIcon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LinkButton } from '@/components/ui/LinkButton';
import { PageLoader } from '@/components/ui/PageLoader';
import { TextLink } from '@/components/ui/TextLink';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { useToast } from '@/hooks/useToast';
import { leccionPath, PATHS } from '@/routes/paths';
import { buildRedirectState } from '@/routes/redirectState';
import { cursosService } from '@/services/cursosService';
import { inscripcionesService } from '@/services/inscripcionesService';
import { nivelLabel } from '@/utils/cursos';
import { pluralize } from '@/utils/format';
import { ROLES } from '@/utils/roles';

/** @typedef {import('@/services/cursosService').CursoDetallePublico} CursoDetallePublico */

/** Detalle público de un curso (`/cursos/:id`): descripción, temario sin contenido e inscripción. */
export default function CourseDetailPage() {
  const { id } = useParams();
  const cursoId = Number(id);

  if (!Number.isInteger(cursoId) || cursoId <= 0) return <CourseNotFound />;
  // `key`: al pasar a otro curso se descarta el estado del anterior (p. ej. la inscripción recién hecha).
  return <CourseDetail key={cursoId} cursoId={cursoId} />;
}

function CourseNotFound() {
  return (
    <>
      <title>Curso no disponible · MiniAula</title>
      <EmptyState
        title="Este curso no existe o ya no está disponible"
        description="Puede que lo hayan despublicado. Busca otro en el catálogo."
        action={
          <LinkButton to={PATHS.catalogo} size="sm">
            Ir al catálogo
          </LinkButton>
        }
        className="mt-8"
      />
    </>
  );
}

/** @param {{ cursoId: number }} props */
function CourseDetail({ cursoId }) {
  const { user } = useAuth();
  const [inscritoAhora, setInscritoAhora] = useState(false);

  // `user?.id` en las deps: al iniciar o cerrar sesión cambia `inscrito`.
  const { data: curso, loading, error, refetch } = useFetch(
    ({ signal }) => cursosService.getCursoDetalle(cursoId, { signal }),
    [cursoId, user?.id],
  );

  if (loading) return <PageLoader />;

  if (error) {
    const noDisponible = isExpectedApiError(error) && (error.status === 404 || error.status === 400);
    if (noDisponible) return <CourseNotFound />;
    return <ErrorMessage title="No se pudo cargar el curso" message={error.message} onRetry={refetch} className="mt-8" />;
  }

  if (!curso) return null;

  return (
    <article className="mx-auto flex max-w-6xl animate-fade-in flex-col gap-6">
      <title>{`${curso.titulo} · MiniAula`}</title>

      <TextLink to={PATHS.catalogo} className="inline-flex items-center gap-1 self-start text-sm">
        <ArrowLeftIcon className="size-4" />
        Volver al catálogo
      </TextLink>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">{curso.categoria}</Badge>
              <Badge>{nivelLabel(curso.nivel)}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{curso.titulo}</h1>
            <p className="text-sm text-fg-muted">Por {curso.instructor.nombre}</p>
          </header>

          {curso.descripcion && (
            <section aria-labelledby="descripcion-curso">
              <h2 id="descripcion-curso" className="text-lg font-semibold text-fg">
                Sobre este curso
              </h2>
              <p className="mt-2 text-sm whitespace-pre-line text-fg-muted">{curso.descripcion}</p>
            </section>
          )}

          <section aria-labelledby="temario-curso" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="temario-curso" className="text-lg font-semibold text-fg">
                Temario
              </h2>
              <span className="text-sm text-fg-subtle">{pluralize(curso.lecciones.length, 'lección', 'lecciones')}</span>
            </div>
            <CourseSyllabus lecciones={curso.lecciones} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <CourseCover imagenUrl={curso.imagenUrl} />
            <div className="p-5">
              <EnrollAction
                curso={curso}
                inscrito={inscritoAhora || curso.inscrito === true}
                onInscrito={() => setInscritoAhora(true)}
              />
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}

/**
 * Llamado a la acción según quién mira: visitante → iniciar sesión (vuelve aquí), estudiante → inscribirse o ir
 * al curso, instructor → aviso.
 * @param {{ curso: CursoDetallePublico, inscrito: boolean, onInscrito: () => void }} props
 */
function EnrollAction({ curso, inscrito, onInscrito }) {
  const { user } = useAuth();
  const location = useLocation();
  const toast = useToast();

  if (!user) {
    return (
      <LinkButton to={PATHS.login} state={buildRedirectState(location)} fullWidth>
        Inicia sesión para inscribirte
      </LinkButton>
    );
  }

  if (user.rol !== ROLES.ESTUDIANTE) {
    return <p className="text-sm text-fg-muted">Solo las cuentas de estudiante pueden inscribirse en cursos.</p>;
  }

  if (inscrito) {
    const primeraLeccion = curso.lecciones[0];
    return (
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-fg">
          <CheckCircleIcon className="size-5 text-success" />
          Ya estás inscrito en este curso
        </p>
        {primeraLeccion && (
          <LinkButton to={leccionPath(curso.id, primeraLeccion.id)} fullWidth>
            Ir al curso
          </LinkButton>
        )}
        <LinkButton to={PATHS.misCursos} variant="secondary" fullWidth>
          Ver mis cursos
        </LinkButton>
      </div>
    );
  }

  const inscribirse = async () => {
    try {
      await inscripcionesService.inscribirse(curso.id);
      toast.success('¡Listo! Ya estás inscrito en el curso.');
      onInscrito();
    } catch (error) {
      if (!isExpectedApiError(error)) throw error;
      if (error.code === 'ALREADY_ENROLLED') {
        onInscrito();
        return;
      }
      // El 401 ya lo avisa el interceptor al cerrar la sesión.
      if (error.status !== 401) toast.error(error.message);
    }
  };

  return (
    <Button onClick={inscribirse} fullWidth>
      Inscribirme
    </Button>
  );
}
