import { Link } from 'react-router';
import { BookOpenIcon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { cursoDetallePath } from '@/routes/paths';
import { nivelLabel } from '@/utils/cursos';
import { pluralize } from '@/utils/format';
import { CourseCover } from './CourseCover';

/**
 * Tarjeta del catálogo. Toda la tarjeta lleva al detalle: el enlace del título se extiende con `after:inset-0`
 * (un solo enlace por tarjeta para teclado y lector de pantalla).
 * @param {{ curso: import('@/services/cursosService').CursoCatalogo }} props
 */
export function CourseCard({ curso }) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow duration-150 focus-within:ring-2 focus-within:ring-ring hover:shadow-md">
      <CourseCover imagenUrl={curso.imagenUrl} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">{curso.categoria}</Badge>
          <Badge>{nivelLabel(curso.nivel)}</Badge>
        </div>
        <h2 className="line-clamp-2 text-lg font-semibold text-fg">
          <Link to={cursoDetallePath(curso.id)} className="after:absolute after:inset-0 focus-visible:outline-none">
            {curso.titulo}
          </Link>
        </h2>
        <p className="text-sm text-fg-muted">Por {curso.instructor.nombre}</p>
        <p className="mt-auto flex items-center gap-1 text-xs text-fg-subtle">
          <BookOpenIcon className="size-4" />
          {pluralize(curso.totalLecciones, 'lección', 'lecciones')}
        </p>
      </div>
    </article>
  );
}
