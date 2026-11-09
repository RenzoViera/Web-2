import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeftIcon, BookOpenIcon, TrashIcon } from '@/components/icons';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { LinkButton } from '@/components/ui/LinkButton';
import { PageLoader } from '@/components/ui/PageLoader';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useAppForm } from '@/hooks/useAppForm';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { cursosService } from '@/services/cursosService';
import { maxLength, minLength, required } from '@/utils/validation';

/** @type {import('@/utils/validation').FormRules} */
const COURSE_RULES = {
  titulo: [
    required('Ingresa el título del curso'),
    minLength(3, 'El título debe tener al menos 3 caracteres'),
    maxLength(200, 'El título no puede superar los 200 caracteres'),
  ],
  categoria: [
    required('Ingresa la categoría'),
    minLength(2, 'La categoría debe tener al menos 2 caracteres'),
    maxLength(100, 'La categoría no puede superar los 100 caracteres'),
  ],
};

const NIVELES_OPTIONS = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];

const ESTADO_BADGES = {
  borrador: { label: 'Borrador', variant: 'neutral' },
  publicado: { label: 'Publicado', variant: 'success' },
  archivado: { label: 'Archivado', variant: 'warning' },
};

export default function CourseEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const cursoId = Number(id);

  const navigate = useNavigate();
  const toast = useToast();

  const [curso, setCurso] = useState(/** @type {import('@/services/cursosService').InstructorCursoDetalle | null} */ (null));
  const [loadingCurso, setLoadingCurso] = useState(isEditing);
  const [fetchError, setFetchError] = useState(/** @type {string | null} */ (null));

  const [nivelValue, setNivelValue] = useState('principiante');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(/** @type {string | null} */ (null));
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    submit,
    formError,
    reset,
    formState: { errors, isSubmitting },
  } = useAppForm({
    defaultValues: {
      titulo: '',
      descripcion: '',
      categoria: '',
      imagenUrl: '',
    },
    rules: COURSE_RULES,
  });

  const loadCurso = async () => {
    if (!isEditing || !Number.isInteger(cursoId)) return;
    setLoadingCurso(true);
    setFetchError(null);
    try {
      const data = await cursosService.getInstructorCurso(cursoId);
      setCurso(data);
      setNivelValue(data.nivel);
      reset({
        titulo: data.titulo,
        descripcion: data.descripcion || '',
        categoria: data.categoria,
        imagenUrl: data.imagenUrl || '',
      });
    } catch (err) {
      setFetchError(/** @type {any} */ (err).message || 'No se pudo cargar el curso');
    } finally {
      setLoadingCurso(false);
    }
  };

  useEffect(() => {
    loadCurso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = submit(async (values) => {
    setActionError(null);
    const payload = {
      titulo: values.titulo.trim(),
      descripcion: values.descripcion.trim() || null,
      categoria: values.categoria.trim(),
      nivel: /** @type {any} */ (nivelValue),
      imagenUrl: values.imagenUrl.trim() || null,
    };

    if (isEditing) {
      const actualizado = await cursosService.actualizarCurso(cursoId, payload);
      setCurso((prev) => (prev ? { ...prev, ...actualizado } : null));
      toast.success('Curso actualizado con éxito');
    } else {
      const nuevo = await cursosService.crearCurso(payload);
      toast.success('Curso creado en estado borrador');
      navigate(`/instructor/cursos/${nuevo.id}/editar`, { replace: true });
    }
  });

  const handleCambiarEstado = async (nuevoEstado) => {
    setActionError(null);
    setActionLoading(true);
    try {
      const actualizado = await cursosService.cambiarEstadoCurso(cursoId, nuevoEstado);
      setCurso((prev) => (prev ? { ...prev, estado: actualizado.estado } : null));
      const estadoLabel = nuevoEstado === 'publicado' ? 'publicado' : nuevoEstado === 'archivado' ? 'archivado' : 'en borrador';
      toast.success(`El curso ahora está ${estadoLabel}`);
    } catch (err) {
      const msg = /** @type {any} */ (err).message || 'No se pudo cambiar el estado del curso';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionError(null);
    setDeleteLoading(true);
    try {
      await cursosService.eliminarCurso(cursoId);
      setShowDeleteDialog(false);
      toast.success('Curso eliminado correctamente');
      navigate(PATHS.instructorCursos);
    } catch (err) {
      const msg = /** @type {any} */ (err).message || 'No se pudo eliminar el curso';
      setActionError(msg);
      toast.error(msg);
      setShowDeleteDialog(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loadingCurso) {
    return <PageLoader />;
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ErrorMessage message={fetchError} onRetry={loadCurso} />
      </div>
    );
  }

  const estadoInfo = curso ? ESTADO_BADGES[curso.estado] ?? { label: curso.estado, variant: 'neutral' } : null;
  const lecciones = curso?.lecciones ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 animate-fade-in">
      <title>{isEditing ? `Editar: ${curso?.titulo ?? 'Curso'}` : 'Nuevo curso'} · MiniAula</title>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LinkButton to={PATHS.instructorCursos} variant="secondary" size="sm">
            <ArrowLeftIcon className="size-4" />
            Volver a mis cursos
          </LinkButton>
          {estadoInfo && (
            <Badge variant={/** @type {any} */ (estadoInfo.variant)}>
              {estadoInfo.label}
            </Badge>
          )}
        </div>

        {isEditing && (
          <div className="flex flex-wrap items-center gap-2">
            {curso?.estado === 'borrador' && (
              <Button
                type="button"
                variant="primary"
                loading={actionLoading}
                onClick={() => handleCambiarEstado('publicado')}
              >
                Publicar curso
              </Button>
            )}
            {curso?.estado === 'publicado' && (
              <Button
                type="button"
                variant="secondary"
                loading={actionLoading}
                onClick={() => handleCambiarEstado('archivado')}
              >
                Archivar curso
              </Button>
            )}
            {curso?.estado === 'archivado' && (
              <Button
                type="button"
                variant="secondary"
                loading={actionLoading}
                onClick={() => handleCambiarEstado('borrador')}
              >
                Volver a borrador
              </Button>
            )}
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="size-4" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulario de curso */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col gap-5">
            <div>
              <h1 className="text-xl font-bold text-fg">
                {isEditing ? 'Información del curso' : 'Crear nuevo curso'}
              </h1>
              <p className="mt-1 text-sm text-fg-muted">
                {isEditing
                  ? 'Modifica los datos principales y publica cuando esté listo.'
                  : 'Todo curso nace como borrador. Podrás agregar lecciones antes de publicarlo.'}
              </p>
            </div>

            {formError && <Alert variant="danger">{formError}</Alert>}
            {actionError && <Alert variant="danger">{actionError}</Alert>}

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Input
                label="Título del curso"
                required
                placeholder="Ej. Programación Frontend con React"
                error={errors.titulo?.message}
                {...register('titulo')}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Categoría"
                  required
                  placeholder="Ej. Desarrollo Web"
                  error={errors.categoria?.message}
                  {...register('categoria')}
                />

                <Select
                  label="Nivel de dificultad"
                  name="nivel"
                  value={nivelValue}
                  onChange={(val) => setNivelValue(val)}
                  options={NIVELES_OPTIONS}
                />
              </div>

              <Textarea
                label="Descripción"
                placeholder="Describe de qué trata el curso, a quién va dirigido y qué aprenderán los estudiantes..."
                error={errors.descripcion?.message}
                {...register('descripcion')}
              />

              <Input
                label="URL de imagen de portada (opcional)"
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                error={errors.imagenUrl?.message}
                {...register('imagenUrl')}
              />

              <div className="mt-2 flex justify-end gap-3 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(PATHS.instructorCursos)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" loading={isSubmitting}>
                  {isEditing ? 'Guardar cambios' : 'Crear curso'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sección de Lecciones (Placeholder para Paso 05) */}
        <div>
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="size-5 text-primary" />
                <h2 className="font-semibold text-fg">Lecciones del curso</h2>
              </div>
              {isEditing && (
                <Badge variant="neutral">
                  {lecciones.length} {lecciones.length === 1 ? 'lección' : 'lecciones'}
                </Badge>
              )}
            </div>

            {!isEditing ? (
              <p className="py-6 text-center text-sm text-fg-muted">
                Primero crea el curso para poder comenzar a redactar y ordenar las lecciones.
              </p>
            ) : lecciones.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <p className="text-sm font-medium text-fg">Aún no hay lecciones agregadas</p>
                <p className="text-xs text-fg-muted">
                  Recuerda: Para poder publicar el curso debes contar con al menos una lección (RN-05).
                </p>
                <div className="mt-3 rounded-lg border border-dashed border-border bg-surface-muted p-3 text-xs text-fg-subtle">
                  📌 En el <strong>Paso 05</strong> se habilitará el editor y reordenamiento de lecciones y preguntas.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="mb-2 rounded-lg border border-border bg-surface-muted/60 p-2 text-xs text-fg-subtle">
                  📌 En el <strong>Paso 05</strong> podrás agregar, editar y reordenar lecciones.
                </div>
                {lecciones.map((leccion) => (
                  <div
                    key={leccion.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-fg-muted">
                        {leccion.orden}
                      </span>
                      <span className="truncate font-medium text-fg">{leccion.titulo}</span>
                    </div>
                    <Badge variant={leccion.tipo === 'cuestionario' ? 'primary' : 'neutral'}>
                      {leccion.tipo === 'cuestionario' ? 'Cuestionario' : 'Contenido'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Cuadro de confirmación para eliminar */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="¿Eliminar este curso?"
        description="Esta acción eliminará el curso y todo su contenido asociado. Ten en cuenta que si el curso ya tiene estudiantes inscritos, no podrá ser eliminado (RN-06)."
        confirmText="Sí, eliminar curso"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
