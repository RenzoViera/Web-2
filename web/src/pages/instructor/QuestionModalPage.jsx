import { useId, useState } from 'react';
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router';
import { QuestionForm } from '@/components/instructor/QuestionForm';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { instructorEditarLeccionPath } from '@/routes/paths';
import { preguntasService } from '@/services/preguntasService';

/**
 * Modal de crear/editar pregunta, ruta hija del editor de lección (`.../preguntas/nueva` y `.../preguntas/:id`).
 * La lección sigue visible detrás. Cerrar vuelve a la pantalla anterior, o al editor si se entró directo
 * por URL (REGLAS C.40).
 */
export default function QuestionModalPage() {
  const { preguntaId } = useParams();
  const { cursoId, leccionId, preguntas, onSaved } =
    /** @type {import('./LessonEditorPage').QuestionOutletContext} */ (useOutletContext());
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const formId = useId();
  const [submitting, setSubmitting] = useState(false);

  const isEditing = preguntaId !== undefined;
  const pregunta = isEditing ? (preguntas.find((item) => item.id === Number(preguntaId)) ?? null) : null;

  const close = () => {
    // 'default' = primera entrada del historial (se abrió la URL directo): no hay pantalla anterior a la que volver.
    if (location.key === 'default') navigate(instructorEditarLeccionPath(cursoId, leccionId), { replace: true });
    else navigate(-1);
  };

  /** @param {import('@/services/preguntasService').PreguntaPayload} payload */
  const handleSubmit = async (payload) => {
    const guardada = pregunta
      ? await preguntasService.actualizar(pregunta.id, payload)
      : await preguntasService.crear(leccionId, payload);
    onSaved(guardada);
    toast.success(pregunta ? 'Pregunta actualizada' : 'Pregunta agregada');
    close();
  };

  if (isEditing && !pregunta) {
    return (
      <Modal title="Pregunta no encontrada" onClose={close}>
        <EmptyState title="Esta pregunta no existe" description="Puede que haya sido eliminada." />
      </Modal>
    );
  }

  return (
    <Modal
      title={pregunta ? 'Editar pregunta' : 'Nueva pregunta'}
      size="lg"
      onClose={close}
      closeDisabled={submitting}
      footer={
        <>
          <Button variant="secondary" disabled={submitting} onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={submitting}>
            {pregunta ? 'Guardar cambios' : 'Agregar pregunta'}
          </Button>
        </>
      }
    >
      <QuestionForm formId={formId} pregunta={pregunta} onSubmit={handleSubmit} onSubmittingChange={setSubmitting} />
    </Modal>
  );
}
