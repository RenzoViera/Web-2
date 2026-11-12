import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { pluralize } from '@/utils/format';

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Vista previa de un cuestionario desbloqueado (sin `indiceCorrecto`, RN-02) mientras se habilita su envío en el Paso 08.
 * @param {{ leccion: import('@/services/progresoService').LeccionEstudiante }} props
 */
export function LessonQuizPreview({ leccion }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="primary">Cuestionario</Badge>
        {leccion.notaMinima !== null && (
          <Badge variant="neutral">Nota mínima para aprobar: {leccion.notaMinima} %</Badge>
        )}
        <span className="text-sm text-fg-muted">
          {pluralize(leccion.preguntas.length, 'pregunta', 'preguntas')}
        </span>
      </div>

      {leccion.contenido && (
        <p className="text-sm leading-relaxed whitespace-pre-line text-fg-muted">{leccion.contenido}</p>
      )}

      <Alert variant="info">
        Este cuestionario se responderá en el siguiente paso. Al aprobarlo con al menos{' '}
        <strong>{leccion.notaMinima ?? 70} %</strong> se marcará como completado y desbloqueará las siguientes lecciones.
      </Alert>

      {leccion.preguntas.length > 0 && (
        <ol className="flex flex-col gap-4">
          {leccion.preguntas.map((pregunta, idx) => (
            <li key={pregunta.id} className="rounded-xl border border-border bg-surface-muted/40 p-4">
              <p className="font-medium text-fg">
                {idx + 1}. {pregunta.enunciado}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {pregunta.opciones.map((opcion, optIdx) => (
                  <li
                    key={`${pregunta.id}-${optIdx}`}
                    className="flex items-start gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-muted"
                  >
                    <span className="font-semibold text-fg">{LETRAS[optIdx] ?? optIdx + 1}.</span>
                    <span>{opcion}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
