import { CourseCover } from '@/components/cursos/CourseCover';
import { BarChartIcon, BookOpenIcon, EditIcon, UsersIcon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/LinkButton';
import { instructorCursoResumenPath, instructorEditarCursoPath } from '@/routes/paths';
import { ESTADO_BADGES, nivelLabel } from '@/utils/cursos';
import { pluralize } from '@/utils/format';

/**
 * Curso del instructor en su listado: estado, conteos y accesos al panel y al editor.
 * @param {{ curso: import('@/services/cursosService').InstructorCursoItem }} props
 */
export function InstructorCourseCard({ curso }) {
  const estado = ESTADO_BADGES[curso.estado];

  return (
    <Card as="article" padding="none" className="flex w-full flex-col justify-between overflow-hidden">
      <div>
        <CourseCover imagenUrl={curso.imagenUrl} />
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={estado.variant}>{estado.label}</Badge>
            <Badge variant="neutral">{curso.categoria}</Badge>
            <Badge variant="neutral">{nivelLabel(curso.nivel)}</Badge>
          </div>
          <h2 className="mt-3 line-clamp-2 text-lg font-semibold break-words text-fg">{curso.titulo}</h2>
          {curso.descripcion && <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{curso.descripcion}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-subtle">
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
        <LinkButton to={instructorCursoResumenPath(curso.id)} variant="secondary" className="w-full">
          <BarChartIcon className="size-4" />
          Panel
        </LinkButton>
        <LinkButton to={instructorEditarCursoPath(curso.id)} className="w-full">
          <EditIcon className="size-4" />
          Editar
        </LinkButton>
      </div>
    </Card>
  );
}
