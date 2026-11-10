import { CourseCover } from '@/components/cursos/CourseCover';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/LinkButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { leccionPath } from '@/routes/paths';
import { ESTADO_BADGES } from '@/utils/cursos';

/** @param {number} porcentaje */
const accionLabel = (porcentaje) => {
  if (porcentaje === 0) return 'Empezar';
  if (porcentaje === 100) return 'Repasar';
  return 'Continuar';
};

/**
 * Curso en "Mis cursos": avance ("3 de 5 lecciones · 60 %") y botón Empezar / Continuar / Repasar que lleva a
 * la siguiente lección sin completar.
 * @param {{ inscripcion: import('@/services/inscripcionesService').MiInscripcion }} props
 */
export function EnrolledCourseCard({ inscripcion }) {
  const { curso, porcentaje, leccionesCompletadas, totalLecciones, siguienteLeccionId } = inscripcion;
  const estado = curso.estado === 'publicado' ? null : ESTADO_BADGES[curso.estado];

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <CourseCover imagenUrl={curso.imagenUrl} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">{curso.categoria}</Badge>
          {estado && <Badge variant={estado.variant}>{estado.label}</Badge>}
        </div>
        <div>
          <h2 className="line-clamp-2 text-lg font-semibold text-fg">{curso.titulo}</h2>
          <p className="mt-1 text-sm text-fg-muted">Por {curso.instructor.nombre}</p>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <ProgressBar value={porcentaje} label={`Avance en ${curso.titulo}`} />
          <p className="text-xs text-fg-muted">
            {leccionesCompletadas} de {totalLecciones} {totalLecciones === 1 ? 'lección' : 'lecciones'} ·{' '}
            {porcentaje} %
          </p>
        </div>

        {siguienteLeccionId === null ? (
          <p className="text-sm text-fg-subtle">Este curso aún no tiene lecciones.</p>
        ) : (
          <LinkButton
            to={leccionPath(curso.id, siguienteLeccionId)}
            variant={porcentaje === 100 ? 'secondary' : 'primary'}
            fullWidth
          >
            {accionLabel(porcentaje)}
          </LinkButton>
        )}
      </div>
    </article>
  );
}
