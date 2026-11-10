import { BookOpenIcon, ListChecksIcon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';

/**
 * Temario público de un curso: orden, título y tipo de cada lección (sin contenido).
 * @param {{ lecciones: import('@/services/cursosService').LeccionTemario[] }} props
 */
export function CourseSyllabus({ lecciones }) {
  if (lecciones.length === 0) {
    return <p className="text-sm text-fg-muted">Este curso aún no tiene lecciones.</p>;
  }

  return (
    <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {lecciones.map((leccion) => {
        const esCuestionario = leccion.tipo === 'cuestionario';
        const Icon = esCuestionario ? ListChecksIcon : BookOpenIcon;
        return (
          <li key={leccion.id} className="flex items-center gap-3 px-4 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-medium text-fg-muted">
              {leccion.orden}
            </span>
            <span className="min-w-0 flex-1 text-sm text-fg">{leccion.titulo}</span>
            {esCuestionario ? (
              <Badge variant="primary" className="gap-1">
                <Icon className="size-3.5" />
                Cuestionario
              </Badge>
            ) : (
              <Icon className="size-4 text-fg-subtle" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
