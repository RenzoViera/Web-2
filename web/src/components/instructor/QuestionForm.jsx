import { useEffect, useEffectEvent } from 'react';
import { useFieldArray } from 'react-hook-form';
import { PlusIcon, TrashIcon } from '@/components/icons';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useAppForm } from '@/hooks/useAppForm';
import { cn } from '@/utils/cn';
import { maxLength, minLength, required, validateField } from '@/utils/validation';

/**
 * @typedef {import('@/services/preguntasService').Pregunta} Pregunta
 * @typedef {import('@/services/preguntasService').PreguntaPayload} PreguntaPayload
 * @typedef {{ enunciado: string, opciones: { texto: string }[], indiceCorrecto: string, explicacion: string }} QuestionFormValues
 */

export const MIN_OPCIONES = 2;
export const MAX_OPCIONES = 6;

/** @type {import('@/utils/validation').Rule} */
const opcionesValidas = (value) => {
  const textos = /** @type {{ texto: string }[]} */ (value).map((opcion) => opcion.texto.trim());
  if (textos.length < MIN_OPCIONES) return `Agrega al menos ${MIN_OPCIONES} opciones`;
  if (textos.some((texto) => texto === '')) return 'Completa todas las opciones o quita las vacías';
  if (textos.some((texto) => texto.length > 300)) return 'Cada opción puede tener hasta 300 caracteres';
  if (new Set(textos.map((texto) => texto.toLowerCase())).size !== textos.length) {
    return 'Las opciones no pueden repetirse';
  }
  return undefined;
};

/** @type {import('@/utils/validation').Rule} */
const correctaMarcada = (value, values) => {
  const total = /** @type {unknown[]} */ (values.opciones).length;
  return value === '' || value == null || Number(value) >= total ? 'Marca cuál es la opción correcta' : undefined;
};

/** @type {import('@/utils/validation').FormRules} */
const QUESTION_RULES = {
  enunciado: [
    required('Ingresa el enunciado'),
    minLength(3, 'El enunciado debe tener al menos 3 caracteres'),
    maxLength(1000, 'El enunciado no puede superar los 1000 caracteres'),
  ],
  opciones: [opcionesValidas],
  indiceCorrecto: [correctaMarcada],
  explicacion: [maxLength(2000, 'La explicación no puede superar los 2000 caracteres')],
};

/**
 * @param {QuestionFormValues} values
 * @returns {PreguntaPayload}
 */
const toPayload = (values) => ({
  enunciado: values.enunciado.trim(),
  opciones: values.opciones.map((opcion) => opcion.texto.trim()),
  indiceCorrecto: Number(values.indiceCorrecto),
  explicacion: values.explicacion.trim() || null,
});

/**
 * Formulario de pregunta de opción múltiple: opciones dinámicas (2-6) y radio para la correcta.
 * El botón de envío vive en el pie del modal y se asocia por `formId`.
 *
 * @param {{
 *   formId: string,
 *   pregunta?: Pregunta | null,
 *   onSubmit: (payload: PreguntaPayload) => Promise<unknown>,
 *   onSubmittingChange?: (submitting: boolean) => void,
 * }} props
 */
export function QuestionForm({ formId, pregunta, onSubmit, onSubmittingChange }) {
  const {
    register,
    submit,
    control,
    getValues,
    setValue,
    clearErrors,
    formError,
    formState: { errors, isSubmitting },
  } = useAppForm({
    /** @type {QuestionFormValues} */
    defaultValues: {
      enunciado: pregunta?.enunciado ?? '',
      opciones: (pregunta?.opciones ?? ['', '']).map((texto) => ({ texto })),
      indiceCorrecto: pregunta ? String(pregunta.indiceCorrecto) : '',
      explicacion: pregunta?.explicacion ?? '',
    },
    rules: QUESTION_RULES,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'opciones' });
  const notifySubmitting = useEffectEvent((/** @type {boolean} */ value) => onSubmittingChange?.(value));

  useEffect(() => {
    notifySubmitting(isSubmitting);
  }, [isSubmitting]);

  /** Un error de grupo se revalida al editar solo para limpiarlo (REGLAS C.39). */
  const clearIfValid = (/** @type {'opciones' | 'indiceCorrecto'} */ name) => {
    if (errors[name] && !validateField(QUESTION_RULES, name, getValues())) clearErrors(name);
  };

  /** Al quitar una opción, la marca de correcta sigue a su opción (o se borra si era esa). */
  const removeOption = (/** @type {number} */ index) => {
    const marcada = getValues('indiceCorrecto');
    remove(index);
    if (marcada !== '') {
      const actual = Number(marcada);
      if (actual === index) setValue('indiceCorrecto', '');
      else if (actual > index) setValue('indiceCorrecto', String(actual - 1));
    }
    clearIfValid('opciones');
  };

  const opcionesError = errors.opciones?.message ?? errors.opciones?.root?.message;
  const correctaError = errors.indiceCorrecto?.message;
  const groupErrorId = `${formId}-opciones-error`;

  return (
    <form id={formId} onSubmit={submit((values) => onSubmit(toPayload(values)))} noValidate className="flex flex-col gap-4">
      {formError && <Alert variant="error">{formError}</Alert>}

      <Textarea
        label="Enunciado"
        required
        rows={3}
        placeholder="Ej. ¿Qué palabra clave declara una constante en JavaScript?"
        data-autofocus
        error={errors.enunciado?.message}
        {...register('enunciado')}
      />

      <fieldset className="flex flex-col gap-2" aria-describedby={opcionesError || correctaError ? groupErrorId : undefined}>
        <legend className="mb-1 text-sm font-medium text-fg">
          Opciones <span className="font-normal text-fg-muted">(marca la correcta)</span>
        </legend>

        {fields.map((field, index) => {
          const opcionId = `${formId}-opcion-${index}`;
          return (
            <div key={field.id} className="flex items-center gap-2">
              <input
                type="radio"
                value={String(index)}
                aria-label={`Opción ${index + 1} es la correcta`}
                className="size-4 shrink-0 accent-primary"
                {...register('indiceCorrecto')}
              />
              <label htmlFor={opcionId} className="sr-only">
                Texto de la opción {index + 1}
              </label>
              <input
                id={opcionId}
                type="text"
                placeholder={`Opción ${index + 1}`}
                maxLength={300}
                className={cn(
                  'h-10 min-w-0 flex-1 rounded-lg border bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle',
                  opcionesError ? 'border-danger' : 'border-border-strong hover:border-fg-subtle',
                )}
                {...register(`opciones.${index}.texto`, { onChange: () => clearIfValid('opciones') })}
              />
              <Button
                variant="ghost"
                size="iconSm"
                className="hover:text-danger"
                aria-label={`Quitar opción ${index + 1}`}
                disabled={fields.length <= MIN_OPCIONES}
                onClick={() => removeOption(index)}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          );
        })}

        {(opcionesError || correctaError) && (
          <p id={groupErrorId} className="animate-fade-in text-xs text-danger">
            {opcionesError ?? correctaError}
          </p>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          disabled={fields.length >= MAX_OPCIONES}
          onClick={() => append({ texto: '' }, { shouldFocus: true })}
        >
          <PlusIcon className="size-4" />
          Agregar opción
          {fields.length >= MAX_OPCIONES && <span className="sr-only"> (máximo {MAX_OPCIONES})</span>}
        </Button>
      </fieldset>

      <Textarea
        label="Explicación (opcional)"
        rows={2}
        placeholder="Por qué esa es la respuesta correcta."
        error={errors.explicacion?.message}
        {...register('explicacion')}
      />
    </form>
  );
}
