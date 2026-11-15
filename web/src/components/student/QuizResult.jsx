import { useEffect, useId, useRef } from 'react';
import { ArrowRightIcon } from '@/components/icons';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { PATHS } from '@/routes/paths';
import { NOTA_MAXIMA, puedeMejorarNota } from '@/utils/cuestionarios';

/**
 * Resultado del intento recién enviado: nota, aprobado/reprobado, mejor nota e intentos restantes, con la acción
 * que corresponde (siguiente lección, reintentar o volver a rendir para mejorar). No muestra cuáles eran las
 * respuestas correctas porque la API no las envía (RN-02). Al aparecer recibe el foco para anunciarse.
 * @param {{
 *   resultado: import('@/services/intentosService').IntentoResultado,
 *   siguientePath: string | null,
 *   onRetry: () => void,
 * }} props
 */
export function QuizResult({ resultado, siguientePath, onRetry }) {
  const headingId = useId();
  const headingRef = useRef(/** @type {HTMLHeadingElement | null} */ (null));
  const { nota, aprobado, aciertos, totalPreguntas, notaMinima, completada, intentos, cursoCompletado } = resultado;
  const quedanIntentos = intentos.restantes > 0;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section aria-labelledby={headingId} className="flex animate-fade-in flex-col items-center gap-5 text-center">
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className="text-sm font-medium tracking-wide text-fg-subtle uppercase outline-none"
      >
        Resultado del intento {intentos.realizados} de {intentos.maximo}
      </h2>

      <div className="flex flex-col items-center gap-3">
        <p className="text-5xl font-bold tracking-tight text-fg">
          {nota}
          <span className="text-2xl font-semibold text-fg-muted"> / {NOTA_MAXIMA}</span>
        </p>
        <Badge variant={aprobado ? 'success' : 'danger'}>{aprobado ? 'Aprobado' : 'Reprobado'}</Badge>
        <p className="text-sm text-fg-muted">
          {aciertos} de {totalPreguntas} respuestas correctas · Nota mínima: {notaMinima}
        </p>
      </div>

      <dl className="grid w-full max-w-sm grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2">
          <dt className="text-xs text-fg-subtle">Mejor nota</dt>
          <dd className="text-lg font-semibold text-fg">
            {intentos.mejorNota ?? nota} / {NOTA_MAXIMA}
          </dd>
        </div>
        <div className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2">
          <dt className="text-xs text-fg-subtle">Intentos restantes</dt>
          <dd className="text-lg font-semibold text-fg">
            {intentos.restantes} de {intentos.maximo}
          </dd>
        </div>
      </dl>

      {completada && cursoCompletado && (
        <Alert variant="success" className="w-full text-left">
          ¡Felicitaciones! Completaste todas las lecciones del curso.
        </Alert>
      )}
      {completada && !aprobado && (
        <Alert variant="info" className="w-full text-left">
          Este intento no alcanzó la nota mínima, pero el cuestionario sigue aprobado con tu mejor nota.
        </Alert>
      )}
      {!completada && !quedanIntentos && (
        <Alert variant="warning" className="w-full text-left">
          Usaste los {intentos.maximo} intentos sin alcanzar la nota mínima. Consulta con el instructor del curso.
        </Alert>
      )}
      {!completada && quedanIntentos && (
        <p className="text-sm text-fg-muted">Repasa las lecciones anteriores y vuelve a intentarlo.</p>
      )}

      <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:justify-center">
        {completada && puedeMejorarNota(intentos) && (
          <Button variant="secondary" onClick={onRetry}>
            Volver a rendir
          </Button>
        )}
        {!completada && quedanIntentos && <Button onClick={onRetry}>Reintentar</Button>}
        {completada &&
          (siguientePath ? (
            <LinkButton to={siguientePath}>
              Siguiente lección
              <ArrowRightIcon className="size-4" />
            </LinkButton>
          ) : (
            <LinkButton to={PATHS.misCursos}>Volver a Mis cursos</LinkButton>
          ))}
        {!completada && !quedanIntentos && (
          <LinkButton to={PATHS.misCursos} variant="secondary">
            Volver a Mis cursos
          </LinkButton>
        )}
      </div>
    </section>
  );
}
