import { useState } from 'react';
import { isExpectedApiError } from '@/api/ApiError';
import { CheckIcon, EditIcon, ListChecksIcon, TrashIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';
import { useToast } from '@/hooks/useToast';
import { instructorPreguntaPath } from '@/routes/paths';
import { preguntasService } from '@/services/preguntasService';
import { cn } from '@/utils/cn';

/** @typedef {import('@/services/preguntasService').Pregunta} Pregunta */

/**
 * Preguntas de un cuestionario. Editar abre el modal con URL propia sobre esta misma pantalla (REGLAS C.40).
 *
 * @param {{
 *   cursoId: number,
 *   leccionId: number,
 *   preguntas: Pregunta[],
 *   onDeleted: (id: number) => void,
 * }} props
 */
export function QuestionList({ cursoId, leccionId, preguntas, onDeleted }) {
  const toast = useToast();
  const [toDelete, setToDelete] = useState(/** @type {Pregunta | null} */ (null));
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await preguntasService.eliminar(toDelete.id);
      onDeleted(toDelete.id);
      toast.success('Pregunta eliminada');
      setToDelete(null);
    } catch (error) {
      setToDelete(null);
      if (!isExpectedApiError(error)) throw error;
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (preguntas.length === 0) {
    return (
      <EmptyState
        className="py-8"
        icon={<ListChecksIcon className="size-8" />}
        title="Este cuestionario aún no tiene preguntas"
        description="Agrega al menos una: un curso con cuestionarios vacíos no se puede publicar."
      />
    );
  }

  return (
    <>
      <ol className="flex flex-col gap-3">
        {preguntas.map((pregunta, index) => (
          <li key={pregunta.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-sm font-medium break-words text-fg">
                <span className="text-fg-muted">{index + 1}. </span>
                {pregunta.enunciado}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <LinkButton
                  to={instructorPreguntaPath(cursoId, leccionId, pregunta.id)}
                  variant="ghost"
                  size="iconSm"
                  aria-label={`Editar pregunta ${index + 1}`}
                >
                  <EditIcon className="size-4" />
                </LinkButton>
                <Button
                  variant="ghost"
                  size="iconSm"
                  className="hover:text-danger"
                  aria-label={`Eliminar pregunta ${index + 1}`}
                  onClick={() => setToDelete(pregunta)}
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            </div>

            <ul className="flex flex-col gap-1.5">
              {pregunta.opciones.map((opcion, opcionIndex) => {
                const correcta = opcionIndex === pregunta.indiceCorrecto;
                return (
                  <li
                    // Las opciones no tienen id y no se reordenan: índice + texto es estable.
                    key={`${opcionIndex}-${opcion}`}
                    className={cn(
                      'flex items-start gap-2 rounded-md border px-3 py-2 text-sm break-words',
                      correcta ? 'border-success/30 bg-success-soft text-fg' : 'border-border text-fg-muted',
                    )}
                  >
                    {correcta ? (
                      <CheckIcon className="mt-0.5 size-4 text-success" />
                    ) : (
                      <span className="size-4 shrink-0" aria-hidden="true" />
                    )}
                    <span className="min-w-0">
                      {opcion}
                      {correcta && <span className="sr-only"> (respuesta correcta)</span>}
                    </span>
                  </li>
                );
              })}
            </ul>

            {pregunta.explicacion && (
              <p className="text-xs text-fg-muted">
                <span className="font-medium text-fg">Explicación: </span>
                {pregunta.explicacion}
              </p>
            )}
          </li>
        ))}
      </ol>

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Eliminar esta pregunta?"
        description={toDelete ? `Se eliminará "${toDelete.enunciado}".` : undefined}
        confirmText="Sí, eliminar"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
