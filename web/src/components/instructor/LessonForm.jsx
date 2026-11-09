import { BookOpenIcon, ListChecksIcon } from '@/components/icons';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RadioCardGroup } from '@/components/ui/RadioCardGroup';
import { Textarea } from '@/components/ui/Textarea';
import { useAppForm } from '@/hooks/useAppForm';
import { integerRange, maxLength, minLength, required, url, when } from '@/utils/validation';

/**
 * @typedef {import('@/services/leccionesService').Leccion} Leccion
 * @typedef {import('@/services/leccionesService').TipoLeccion} TipoLeccion
 * @typedef {{ tipo: TipoLeccion, titulo: string, contenido: string, videoUrl: string, notaMinima: string }} LessonFormValues
 */

/** @param {Record<string, unknown>} values */
const esContenido = (values) => values.tipo === 'contenido';
/** @param {Record<string, unknown>} values */
const esCuestionario = (values) => values.tipo === 'cuestionario';

/** @type {import('@/utils/validation').FormRules} */
const LESSON_RULES = {
  titulo: [
    required('Ingresa el título de la lección'),
    minLength(3, 'El título debe tener al menos 3 caracteres'),
    maxLength(200, 'El título no puede superar los 200 caracteres'),
  ],
  contenido: [maxLength(20000, 'El contenido no puede superar los 20000 caracteres')],
  videoUrl: [
    when(esContenido, [
      url('Ingresa una URL válida que empiece con http:// o https://'),
      maxLength(500, 'La URL no puede superar los 500 caracteres'),
    ]),
  ],
  notaMinima: [
    when(esCuestionario, [
      required('Ingresa la nota mínima para aprobar'),
      integerRange(0, 100, 'La nota mínima debe ser un número entero entre 0 y 100'),
    ]),
  ],
};

/** @type {import('@/components/ui/RadioCardGroup').RadioCardOption[]} */
const TIPO_OPTIONS = [
  {
    value: 'contenido',
    label: 'Contenido',
    description: 'Texto y, si quieres, un video.',
    icon: <BookOpenIcon className="size-5" />,
  },
  {
    value: 'cuestionario',
    label: 'Cuestionario',
    description: 'Preguntas de opción múltiple con nota mínima.',
    icon: <ListChecksIcon className="size-5" />,
  },
];

/**
 * Payload según el tipo: cada tipo solo envía sus campos.
 * @param {LessonFormValues} values
 * @param {boolean} incluirTipo
 * @returns {import('@/services/leccionesService').CrearLeccionPayload | import('@/services/leccionesService').ActualizarLeccionPayload}
 */
const toPayload = (values, incluirTipo) => {
  const base = { titulo: values.titulo.trim(), contenido: values.contenido.trim() || null };
  const especificos =
    values.tipo === 'cuestionario'
      ? { notaMinima: Number(values.notaMinima) }
      : { videoUrl: values.videoUrl.trim() || null };
  return incluirTipo ? { tipo: values.tipo, ...base, ...especificos } : { ...base, ...especificos };
};

/**
 * Formulario de lección. Al crear se elige el tipo; al editar el tipo es fijo (la API no lo permite cambiar).
 *
 * @param {{
 *   leccion?: Leccion | null,
 *   onSubmit: (payload: ReturnType<typeof toPayload>, tipo: TipoLeccion) => Promise<unknown>,
 *   onCancel: () => void,
 * }} props
 */
export function LessonForm({ leccion, onSubmit, onCancel }) {
  const isEditing = Boolean(leccion);
  const {
    register,
    submit,
    watch,
    formError,
    formState: { errors, isSubmitting },
  } = useAppForm({
    /** @type {LessonFormValues} */
    defaultValues: {
      tipo: leccion?.tipo ?? 'contenido',
      titulo: leccion?.titulo ?? '',
      contenido: leccion?.contenido ?? '',
      videoUrl: leccion?.videoUrl ?? '',
      notaMinima: leccion?.notaMinima != null ? String(leccion.notaMinima) : '70',
    },
    rules: LESSON_RULES,
  });

  const tipo = watch('tipo');
  const cuestionario = tipo === 'cuestionario';

  const handleSubmit = submit((values) => onSubmit(toPayload(values, !isEditing), values.tipo));

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError && <Alert variant="error">{formError}</Alert>}

      {isEditing ? (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          Tipo:
          <Badge variant={cuestionario ? 'primary' : 'neutral'}>{cuestionario ? 'Cuestionario' : 'Contenido'}</Badge>
        </p>
      ) : (
        <RadioCardGroup
          legend="Tipo de lección"
          options={TIPO_OPTIONS}
          hint="El tipo no se puede cambiar después de crear la lección."
          error={errors.tipo?.message}
          {...register('tipo')}
        />
      )}

      <Input
        label="Título"
        required
        placeholder={cuestionario ? 'Ej. Evaluación del módulo 1' : 'Ej. Variables y tipos de datos'}
        error={errors.titulo?.message}
        {...register('titulo')}
      />

      {cuestionario ? (
        <Input
          label="Nota mínima para aprobar (0-100)"
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          step={1}
          required
          className="sm:max-w-60"
          error={errors.notaMinima?.message}
          {...register('notaMinima')}
        />
      ) : (
        <Input
          label="URL del video (opcional)"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          hint="YouTube u otro enlace público."
          error={errors.videoUrl?.message}
          {...register('videoUrl')}
        />
      )}

      <Textarea
        label={cuestionario ? 'Instrucciones (opcional)' : 'Contenido'}
        rows={cuestionario ? 3 : 10}
        placeholder={
          cuestionario
            ? 'Indica a los estudiantes qué evalúa este cuestionario.'
            : 'Escribe el texto de la lección.'
        }
        error={errors.contenido?.message}
        {...register('contenido')}
      />

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEditing ? 'Guardar cambios' : 'Crear lección'}
        </Button>
      </div>
    </form>
  );
}
