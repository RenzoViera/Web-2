import { useState } from 'react';
import { isExpectedApiError } from '@/api/ApiError';
import { ArrowDownIcon, ArrowUpIcon, BookOpenIcon, EditIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';
import { useToast } from '@/hooks/useToast';
import { instructorEditarLeccionPath, instructorNuevaLeccionPath } from '@/routes/paths';
import { leccionesService } from '@/services/leccionesService';

/**
 * @typedef {import('@/services/cursosService').InstructorCursoDetalle['lecciones'][number]} LeccionEditor
 */

/** @param {LeccionEditor[]} lecciones */
const renumerar = (lecciones) => lecciones.map((leccion, index) => ({ ...leccion, orden: index + 1 }));

/**
 * Temario editable de un curso: agregar, editar, eliminar y reordenar con ↑/↓.
 * El reordenamiento es optimista (REGLAS C.15): se ve al instante y vuelve atrás con un aviso si la API falla.
 *
 * @param {{
 *   cursoId: number,
 *   lecciones: LeccionEditor[],
 *   onChange: (lecciones: LeccionEditor[]) => void,
 * }} props
 */
export function LessonList({ cursoId, lecciones, onChange }) {
  const toast = useToast();
  const [reordering, setReordering] = useState(false);
  const [toDelete, setToDelete] = useState(/** @type {LeccionEditor | null} */ (null));
  const [deleting, setDeleting] = useState(false);

  /**
   * @param {number} index
   * @param {-1 | 1} delta
   */
  const move = async (index, delta) => {
    const target = index + delta;
    if (reordering || target < 0 || target >= lecciones.length) return;

    const previous = lecciones;
    const next = [...lecciones];
    [next[index], next[target]] = [next[target], next[index]];
    const optimistic = renumerar(next);
    onChange(optimistic);
    setReordering(true);
    try {
      const actualizadas = await leccionesService.reordenar(
        cursoId,
        optimistic.map((leccion) => leccion.id),
      );
      // La API devuelve las lecciones sin preguntas: se conservan las que ya estaban cargadas.
      const preguntasPorId = new Map(optimistic.map((leccion) => [leccion.id, leccion.preguntas]));
      onChange(actualizadas.map((leccion) => ({ ...leccion, preguntas: preguntasPorId.get(leccion.id) ?? [] })));
    } catch (error) {
      onChange(previous);
      if (!isExpectedApiError(error)) throw error;
      toast.error(error.message);
    } finally {
      setReordering(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await leccionesService.eliminar(toDelete.id);
      onChange(renumerar(lecciones.filter((leccion) => leccion.id !== toDelete.id)));
      toast.success('Lección eliminada');
      setToDelete(null);
    } catch (error) {
      setToDelete(null);
      if (!isExpectedApiError(error)) throw error;
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {lecciones.length === 0 ? (
        <EmptyState
          className="py-8"
          icon={<BookOpenIcon className="size-8" />}
          title="Este curso aún no tiene lecciones"
          description="Agrega al menos una para poder publicarlo."
        />
      ) : (
        <ol className="flex flex-col gap-2" aria-label="Lecciones del curso">
          {lecciones.map((leccion, index) => {
            const esCuestionario = leccion.tipo === 'cuestionario';
            const totalPreguntas = leccion.preguntas?.length ?? 0;
            return (
              <li key={leccion.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
                <div className="flex items-start gap-2">
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-fg-muted"
                    aria-hidden="true"
                  >
                    {leccion.orden}
                  </span>
                  <span className="line-clamp-2 min-w-0 text-sm font-medium break-words text-fg">
                    <span className="sr-only">Lección {leccion.orden}: </span>
                    {leccion.titulo}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={esCuestionario ? 'primary' : 'neutral'}>
                      {esCuestionario ? 'Cuestionario' : 'Contenido'}
                    </Badge>
                    {esCuestionario && (
                      <Badge variant={totalPreguntas === 0 ? 'warning' : 'neutral'}>
                        {totalPreguntas === 0
                          ? 'Sin preguntas'
                          : `${totalPreguntas} ${totalPreguntas === 1 ? 'pregunta' : 'preguntas'}`}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`Subir "${leccion.titulo}"`}
                      disabled={index === 0 || reordering}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUpIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`Bajar "${leccion.titulo}"`}
                      disabled={index === lecciones.length - 1 || reordering}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDownIcon className="size-4" />
                    </Button>
                    <LinkButton
                      to={instructorEditarLeccionPath(cursoId, leccion.id)}
                      variant="ghost"
                      size="iconSm"
                      aria-label={`Editar "${leccion.titulo}"`}
                    >
                      <EditIcon className="size-4" />
                    </LinkButton>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      className="hover:text-danger"
                      aria-label={`Eliminar "${leccion.titulo}"`}
                      onClick={() => setToDelete(leccion)}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <LinkButton to={instructorNuevaLeccionPath(cursoId)} variant="secondary" fullWidth>
        <PlusIcon className="size-4" />
        Agregar lección
      </LinkButton>

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Eliminar esta lección?"
        description={
          toDelete
            ? `Se eliminará "${toDelete.titulo}" con su contenido y preguntas. No se puede eliminar si el curso ya tiene estudiantes inscritos.`
            : undefined
        }
        confirmText="Sí, eliminar"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
