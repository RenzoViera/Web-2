import { useState } from 'react';
import { CheckCircleIcon, ListChecksIcon } from '@/components/icons';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';
import { PATHS } from '@/routes/paths';
import { intentosRestantesLabel, NOTA_MAXIMA, puedeMejorarNota } from '@/utils/cuestionarios';
import { QuizForm } from '@/components/student/QuizForm';
import { QuizResult } from '@/components/student/QuizResult';

/** @typedef {import('@/services/intentosService').IntentoResultado} IntentoResultado */
/** @typedef {import('@/services/intentosService').RespuestaIntento} RespuestaIntento */

/**
 * Cuestionario de la vista de lección (RF-15). Según el estado muestra el formulario del próximo intento, el
 * resultado del intento recién enviado, el resumen de uno ya aprobado (con opción de volver a rendir mientras
 * queden intentos) o el aviso de intentos agotados. El padre lo monta con `key={leccion.id}`.
 * @param {{
 *   leccion: import('@/services/progresoService').LeccionEstudiante,
 *   siguientePath: string | null,
 *   onSubmit: (respuestas: RespuestaIntento[]) => Promise<IntentoResultado>,
 * }} props
 */
export function LessonQuiz({ leccion, siguientePath, onSubmit }) {
  const [resultado, setResultado] = useState(/** @type {IntentoResultado | null} */ (null));
  const [reintentando, setReintentando] = useState(false);
  const { intentos, preguntas, notaMinima } = leccion;

  if (!intentos || preguntas.length === 0) {
    return (
      <EmptyState
        icon={<ListChecksIcon className="size-10" />}
        title="Este cuestionario aún no tiene preguntas"
        description="El instructor todavía no cargó sus preguntas. Vuelve más tarde."
      />
    );
  }

  /** @param {RespuestaIntento[]} respuestas */
  const handleSubmit = async (respuestas) => {
    const res = await onSubmit(respuestas);
    setReintentando(false);
    setResultado(res);
  };

  const reintentar = () => {
    setResultado(null);
    setReintentando(true);
  };

  const instrucciones = leccion.contenido && (
    <p className="text-sm leading-relaxed whitespace-pre-line text-fg-muted">{leccion.contenido}</p>
  );

  if (resultado) {
    return <QuizResult resultado={resultado} siguientePath={siguientePath} onRetry={reintentar} />;
  }

  if (leccion.completada && !reintentando) {
    const mejorable = puedeMejorarNota(intentos);
    return (
      <div className="flex flex-col gap-5">
        {instrucciones}
        <Alert variant="success">
          Aprobaste este cuestionario con{' '}
          <strong>
            {intentos.mejorNota ?? 0} / {NOTA_MAXIMA}
          </strong>
          .{mejorable && ` ${intentosRestantesLabel(intentos.restantes)} por si quieres mejorar tu nota.`}
        </Alert>
        {mejorable && (
          <div>
            <Button variant="secondary" onClick={() => setReintentando(true)}>
              Volver a rendir
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (intentos.restantes === 0) {
    return (
      <div className="flex flex-col gap-5">
        {instrucciones}
        <Alert variant="warning">
          Usaste los {intentos.maximo} intentos sin alcanzar la nota mínima
          {notaMinima !== null && ` (${notaMinima})`}. Tu mejor nota fue{' '}
          <strong>
            {intentos.mejorNota ?? 0} / {NOTA_MAXIMA}
          </strong>
          . Consulta con el instructor del curso.
        </Alert>
        <div>
          <LinkButton to={PATHS.misCursos} variant="secondary">
            Volver a Mis cursos
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {instrucciones}
      {leccion.completada && (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <CheckCircleIcon className="size-4 text-success" />
          <span>Ya aprobaste este cuestionario: si este intento sale peor, se conserva tu mejor nota.</span>
        </p>
      )}
      <QuizForm preguntas={preguntas} notaMinima={notaMinima} intentos={intentos} onSubmit={handleSubmit} />
    </div>
  );
}
