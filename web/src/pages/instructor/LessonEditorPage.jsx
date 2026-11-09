import { Suspense, useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router';
import { ArrowLeftIcon, PlusIcon } from '@/components/icons';
import { LessonForm } from '@/components/instructor/LessonForm';
import { QuestionList } from '@/components/instructor/QuestionList';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LinkButton } from '@/components/ui/LinkButton';
import { PageLoader } from '@/components/ui/PageLoader';
import { useFetch } from '@/hooks/useFetch';
import { useToast } from '@/hooks/useToast';
import { instructorEditarCursoPath, instructorEditarLeccionPath, instructorPreguntaPath } from '@/routes/paths';
import { cursosService } from '@/services/cursosService';
import { leccionesService } from '@/services/leccionesService';

/**
 * @typedef {import('@/services/preguntasService').Pregunta} Pregunta
 * @typedef {import('@/services/leccionesService').Leccion} Leccion
 *
 * @typedef {object} QuestionOutletContext Contexto que reciben los modales de pregunta (rutas hijas).
 * @property {number} cursoId
 * @property {number} leccionId
 * @property {Pregunta[]} preguntas
 * @property {(pregunta: Pregunta) => void} onSaved Agrega o reemplaza la pregunta en la lista.
 */

/**
 * Editor de lección (crear o editar). Para cuestionarios incluye el CRUD de preguntas; cada pregunta se edita
 * en un modal con URL propia renderizado por `<Outlet />` (REGLAS C.40).
 * El `key` por lección remonta el editor al pasar de "nueva" a "editar" (formulario con valores frescos).
 */
export default function LessonEditorPage() {
  const { cursoId, leccionId } = useParams();
  return <LessonEditor key={leccionId ?? 'nueva'} cursoId={Number(cursoId)} leccionId={leccionId ? Number(leccionId) : null} />;
}

/**
 * @param {{ cursoId: number, leccionId: number | null }} props
 */
function LessonEditor({ cursoId, leccionId }) {
  const isEditing = leccionId !== null;
  const navigate = useNavigate();
  const toast = useToast();
  const cursoPath = instructorEditarCursoPath(cursoId);

  // El curso del editor trae lecciones y preguntas (con la correcta): una sola petición.
  const { data: curso, loading, error, refetch } = useFetch(
    ({ signal }) => cursosService.getInstructorCurso(cursoId, { signal }),
    [cursoId],
    { immediate: isEditing },
  );

  const leccion = isEditing ? (curso?.lecciones.find((item) => item.id === leccionId) ?? null) : null;
  const [titulo, setTitulo] = useState(/** @type {string | null} */ (null));
  const [preguntas, setPreguntas] = useState(/** @type {Pregunta[] | null} */ (null));
  const listaPreguntas = preguntas ?? leccion?.preguntas ?? [];

  /**
   * @param {import('@/services/leccionesService').CrearLeccionPayload | import('@/services/leccionesService').ActualizarLeccionPayload} payload
   * @param {import('@/services/leccionesService').TipoLeccion} tipo
   */
  const handleSubmit = async (payload, tipo) => {
    if (isEditing) {
      const actualizada = await leccionesService.actualizar(leccionId, payload);
      setTitulo(actualizada.titulo);
      toast.success('Lección guardada');
      return;
    }

    const nueva = await leccionesService.crear(
      cursoId,
      /** @type {import('@/services/leccionesService').CrearLeccionPayload} */ (payload),
    );
    if (tipo === 'cuestionario') {
      toast.success('Cuestionario creado. Ahora agrega sus preguntas.');
      navigate(instructorEditarLeccionPath(cursoId, nueva.id), { replace: true });
    } else {
      toast.success('Lección creada');
      navigate(cursoPath);
    }
  };

  /** @type {QuestionOutletContext} */
  const outletContext = {
    cursoId,
    leccionId: leccionId ?? 0,
    preguntas: listaPreguntas,
    onSaved: (pregunta) =>
      setPreguntas((prev) => {
        const actuales = prev ?? leccion?.preguntas ?? [];
        return actuales.some((item) => item.id === pregunta.id)
          ? actuales.map((item) => (item.id === pregunta.id ? pregunta : item))
          : [...actuales, pregunta];
      }),
  };

  if (isEditing && loading) return <PageLoader />;

  if (isEditing && (error || !leccion)) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 py-8">
        <ErrorMessage
          title={error ? 'No se pudo cargar la lección' : 'La lección no existe'}
          message={error?.message ?? 'Puede que haya sido eliminada.'}
          onRetry={error ? refetch : undefined}
        />
        <LinkButton to={cursoPath} variant="secondary" className="self-center">
          Volver al curso
        </LinkButton>
      </div>
    );
  }

  const esCuestionario = leccion?.tipo === 'cuestionario';
  const tituloActual = titulo ?? leccion?.titulo;

  return (
    <div className="mx-auto flex max-w-3xl animate-fade-in flex-col gap-6">
      <title>{`${isEditing ? `Editar: ${tituloActual}` : 'Nueva lección'} · MiniAula`}</title>

      <div className="flex flex-col gap-3">
        <LinkButton to={cursoPath} variant="secondary" size="sm" className="self-start">
          <ArrowLeftIcon className="size-4" />
          Volver al curso
        </LinkButton>
        <div className="min-w-0">
          {curso && <p className="truncate text-sm text-fg-muted">{curso.titulo}</p>}
          <h1 className="text-xl font-bold break-words text-fg">
            {isEditing ? `Lección ${leccion?.orden}: ${tituloActual}` : 'Nueva lección'}
          </h1>
        </div>
      </div>

      <Card>
        <LessonForm leccion={leccion} onSubmit={handleSubmit} onCancel={() => navigate(cursoPath)} />
      </Card>

      {esCuestionario && (
        <Card as="section" aria-labelledby="preguntas-title" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 id="preguntas-title" className="font-semibold text-fg">
                Preguntas
              </h2>
              <Badge variant="neutral">{listaPreguntas.length}</Badge>
            </div>
            <LinkButton to={instructorPreguntaPath(cursoId, leccion.id)} size="sm">
              <PlusIcon className="size-4" />
              Agregar pregunta
            </LinkButton>
          </div>
          <QuestionList
            cursoId={cursoId}
            leccionId={leccion.id}
            preguntas={listaPreguntas}
            onDeleted={(id) => setPreguntas(listaPreguntas.filter((item) => item.id !== id))}
          />
          <Suspense fallback={null}>
            <Outlet context={outletContext} />
          </Suspense>
        </Card>
      )}
    </div>
  );
}
