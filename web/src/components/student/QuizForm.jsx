import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { RadioCardGroup } from '@/components/ui/RadioCardGroup';
import { useAppForm } from '@/hooks/useAppForm';
import { pluralize } from '@/utils/format';
import { required } from '@/utils/validation';

/** @typedef {import('@/services/progresoService').PreguntaPublica} PreguntaPublica */
/** @typedef {import('@/services/progresoService').ResumenIntentos} ResumenIntentos */
/** @typedef {import('@/services/intentosService').RespuestaIntento} RespuestaIntento */

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** @param {number} preguntaId */
const fieldName = (preguntaId) => `pregunta${preguntaId}`;

/**
 * Valores y reglas del formulario: un campo obligatorio por pregunta. Las preguntas no cambian mientras el
 * formulario está montado (el padre lo monta de nuevo en cada intento), así que se construyen una sola vez.
 * @param {PreguntaPublica[]} preguntas
 */
const buildFormConfig = (preguntas) => ({
  defaultValues: /** @type {Record<string, string>} */ (Object.fromEntries(preguntas.map((p) => [fieldName(p.id), '']))),
  rules: Object.fromEntries(preguntas.map((p) => [fieldName(p.id), [required('Elige una respuesta')]])),
});

/** @param {PreguntaPublica} pregunta */
const toOptions = (pregunta) =>
  pregunta.opciones.map((texto, indice) => ({
    value: String(indice),
    label: texto,
    icon: <span className="font-semibold">{LETRAS[indice] ?? indice + 1}.</span>,
  }));

/**
 * Formulario de un intento: una pregunta por bloque con sus opciones como radios. Valida que todas tengan
 * respuesta (REGLAS C.39) y muestra en `formError` los errores de la API (p. ej. intentos agotados).
 * @param {{
 *   preguntas: PreguntaPublica[],
 *   notaMinima: number | null,
 *   intentos: ResumenIntentos,
 *   onSubmit: (respuestas: RespuestaIntento[]) => Promise<unknown>,
 * }} props
 */
export function QuizForm({ preguntas, notaMinima, intentos, onSubmit }) {
  const [config] = useState(() => buildFormConfig(preguntas));
  const {
    register,
    submit,
    formError,
    formState: { errors, isSubmitting },
  } = useAppForm(config);

  const handleSubmit = submit(async (values) => {
    await onSubmit(preguntas.map((p) => ({ preguntaId: p.id, indice: Number(values[fieldName(p.id)]) })));
  });

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <p className="text-sm font-medium text-fg-muted">
        Intento {intentos.realizados + 1} de {intentos.maximo} · {pluralize(preguntas.length, 'pregunta', 'preguntas')}
        {notaMinima !== null && ` · Nota mínima: ${notaMinima}`}
        {intentos.mejorNota !== null && ` · Mejor nota hasta ahora: ${intentos.mejorNota}`}
      </p>

      {formError && <Alert variant="error">{formError}</Alert>}

      <ol className="flex flex-col gap-4">
        {preguntas.map((pregunta, posicion) => (
          <li key={pregunta.id} className="rounded-xl border border-border bg-surface-muted/40 p-4 sm:p-5">
            <RadioCardGroup
              variant="list"
              legend={`${posicion + 1}. ${pregunta.enunciado}`}
              options={toOptions(pregunta)}
              error={errors[fieldName(pregunta.id)]?.message}
              {...register(fieldName(pregunta.id))}
            />
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-fg-muted">
          {intentos.restantes === 1
            ? 'Es tu último intento: revisa tus respuestas antes de enviar.'
            : 'Se califica al enviar. Se guarda tu mejor nota.'}
        </p>
        <Button type="submit" loading={isSubmitting}>
          Enviar respuestas
        </Button>
      </div>
    </form>
  );
}
