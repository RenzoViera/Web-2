import { cn } from '@/utils/cn';
import { pluralize } from '@/utils/format';
import { Button } from './Button';

/**
 * Paginación de un listado (`meta` de la API). No se muestra si hay una sola página.
 * @param {{
 *   meta: { page: number, totalPages: number, total: number },
 *   onPageChange: (page: number) => void,
 *   itemLabel?: [singular: string, plural: string],
 *   className?: string,
 * }} props `itemLabel`: sustantivo del total ("1 curso" / "12 cursos").
 */
export function Pagination({ meta, onPageChange, itemLabel = ['resultado', 'resultados'], className }) {
  const { page, totalPages, total } = meta;
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginación"
      className={cn(
        'flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-sm text-fg-muted">
        Página {page} de {totalPages} · {pluralize(total, ...itemLabel)}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.min(page - 1, totalPages))}
        >
          Anterior
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
