import { useState } from 'react';
import { useParams } from 'react-router';
import { CourseCover } from '@/components/cursos/CourseCover';
import {
  ArrowLeftIcon,
  AwardIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  TrendingUpIcon,
  UsersIcon,
} from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { LinkButton } from '@/components/ui/LinkButton';
import { PageLoader } from '@/components/ui/PageLoader';
import { Pagination } from '@/components/ui/Pagination';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { useFetch } from '@/hooks/useFetch';
import { instructorEditarCursoPath, PATHS } from '@/routes/paths';
import { instructorService } from '@/services/instructorService';
import { ESTADO_BADGES, nivelLabel } from '@/utils/cursos';
import { formatDate, pluralize } from '@/utils/format';

const STUDENTS_PER_PAGE = 10;
const SEARCH_DELAY_MS = 300;

export default function CourseMetricsPage() {
  const { id } = useParams();
  const cursoId = id ? Number(id) : 0;

  // Filtros y paginación para la lista de estudiantes
  const [studentPage, setStudentPage] = useState(1);
  const [studentSearch, setStudentSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCompletado, setFilterCompletado] = useState(/** @type {boolean | undefined} */ (undefined));

  const handleSearchChange = useDebouncedCallback(
    /** @param {string} val */
    (val) => {
      setDebouncedSearch(val);
      setStudentPage(1);
    },
    SEARCH_DELAY_MS,
  );

  // 1. Resumen general y métricas del curso (independiente de la paginación de alumnos)
  const {
    data: resumenData,
    loading: loadingResumen,
    error: errorResumen,
    refetch: refetchResumen,
  } = useFetch(
    ({ signal }) => instructorService.getCursoResumen(cursoId, { signal }),
    [cursoId],
  );

  // 2. Listado paginado de estudiantes inscritos
  const {
    data: estudiantesData,
    loading: loadingEstudiantes,
    error: errorEstudiantes,
    refetch: refetchEstudiantes,
  } = useFetch(
    ({ signal }) =>
      instructorService.getCursoEstudiantes(
        cursoId,
        {
          page: studentPage,
          limit: STUDENTS_PER_PAGE,
          q: debouncedSearch || undefined,
          completado: filterCompletado,
        },
        { signal },
      ),
    [cursoId, studentPage, debouncedSearch, filterCompletado],
  );

  if (loadingResumen) {
    return <PageLoader />;
  }

  if (errorResumen || !resumenData) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <ErrorMessage
          message={errorResumen?.message || 'Error al cargar las métricas del curso'}
          onRetry={refetchResumen}
        />
      </div>
    );
  }

  const { curso, metricas, lecciones } = resumenData;
  const estadoInfo = ESTADO_BADGES[curso.estado];
  const estudiantes = estudiantesData?.data ?? [];
  const estudiantesMeta = estudiantesData?.meta;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 animate-fade-in">
      <title>{`Métricas: ${curso.titulo} · MiniAula`}</title>

      {/* Navegación y encabezado */}
      <div>
        <LinkButton
          to={PATHS.instructorCursos}
          variant="ghost"
          size="sm"
          className="mb-3 -ml-2 inline-flex items-center gap-1 text-fg-muted hover:text-fg"
        >
          <ArrowLeftIcon className="size-4" />
          Volver a mis cursos
        </LinkButton>

        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden size-20 shrink-0 overflow-hidden rounded-lg border border-border sm:block">
              <CourseCover imagenUrl={curso.imagenUrl} className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
                <Badge variant="neutral">{curso.categoria}</Badge>
                <Badge variant="neutral">{nivelLabel(curso.nivel)}</Badge>
              </div>
              <h1 className="mt-2 text-xl font-bold tracking-tight text-fg sm:text-2xl">
                {curso.titulo}
              </h1>
              <p className="mt-1 text-xs text-fg-subtle">
                Creado el {formatDate(curso.createdAt)} · {pluralize(metricas.totalLecciones, 'lección', 'lecciones')}
              </p>
            </div>
          </div>

          <LinkButton
            to={instructorEditarCursoPath(curso.id)}
            variant="secondary"
            className="self-start sm:self-auto"
          >
            <EditIcon className="size-4" />
            Editar curso
          </LinkButton>
        </div>
      </div>

      {/* KPI Cards principales */}
      <section aria-label="Métricas clave" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="flex flex-col gap-1 p-5">
          <div className="flex items-center justify-between text-fg-subtle">
            <span className="text-xs font-medium uppercase tracking-wider">Inscritos</span>
            <UsersIcon className="size-4 text-primary" />
          </div>
          <span className="text-3xl font-bold text-fg">{metricas.totalInscritos}</span>
          <span className="text-xs text-fg-muted">
            {pluralize(metricas.totalInscritos, 'estudiante matriculado', 'estudiantes matriculados')}
          </span>
        </Card>

        <Card className="flex flex-col gap-1 p-5">
          <div className="flex items-center justify-between text-fg-subtle">
            <span className="text-xs font-medium uppercase tracking-wider">Completados</span>
            <AwardIcon className="size-4 text-success" />
          </div>
          <span className="text-3xl font-bold text-fg">{metricas.totalCompletados}</span>
          <span className="text-xs text-fg-muted">
            {pluralize(metricas.totalCompletados, 'estudiante finalizó', 'estudiantes finalizaron')} el curso
          </span>
        </Card>

        <Card className="flex flex-col gap-1 p-5">
          <div className="flex items-center justify-between text-fg-subtle">
            <span className="text-xs font-medium uppercase tracking-wider">Tasa de finalización</span>
            <TrendingUpIcon className="size-4 text-primary" />
          </div>
          <span className="text-3xl font-bold text-fg">{metricas.tasaCompletitud}%</span>
          <span className="text-xs text-fg-muted">del total de inscritos</span>
        </Card>

        <Card className="flex flex-col gap-1 p-5">
          <div className="flex items-center justify-between text-fg-subtle">
            <span className="text-xs font-medium uppercase tracking-wider">Avance promedio</span>
            <BookOpenIcon className="size-4 text-primary" />
          </div>
          <span className="text-3xl font-bold text-fg">{metricas.promedioProgreso}%</span>
          <div className="mt-1">
            <ProgressBar value={metricas.promedioProgreso} label="Avance promedio de estudiantes" size="sm" />
          </div>
        </Card>
      </section>

      {/* Sección: Avance por lección (Embudo de finalización) */}
      <section aria-labelledby="seccion-lecciones" className="flex flex-col gap-4">
        <div>
          <h2 id="seccion-lecciones" className="text-lg font-bold text-fg sm:text-xl">
            Avance por lección
          </h2>
          <p className="mt-0.5 text-sm text-fg-muted">
            Monitorea el progreso de tus estudiantes a lo largo de cada lección y detecta posibles cuellos de botella.
          </p>
        </div>

        {lecciones.length === 0 ? (
          <Card className="py-8">
            <EmptyState
              title="Este curso aún no tiene lecciones"
              description="Agrega lecciones y cuestionarios en el editor para comenzar a recibir métricas de avance."
              action={
                <LinkButton to={instructorEditarCursoPath(curso.id)} size="sm">
                  Ir al editor de lecciones
                </LinkButton>
              }
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {lecciones.map((leccion) => {
              const esCuestionario = leccion.tipo === 'cuestionario';

              return (
                <Card key={leccion.id} className="flex flex-col gap-4 p-5 transition-shadow hover:shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-fg-muted">
                        {leccion.orden}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-fg">{leccion.titulo}</h3>
                          <Badge variant={esCuestionario ? 'primary' : 'neutral'}>
                            {esCuestionario ? 'Cuestionario' : 'Contenido'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-fg-muted">
                          {leccion.completados} de {metricas.totalInscritos} estudiantes completaron esta lección
                          ({leccion.tasaCompletitud}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full sm:w-48 flex-col gap-1">
                      <div className="flex items-center justify-between text-xs text-fg-muted">
                        <span>Completitud</span>
                        <span className="font-semibold text-fg">{leccion.tasaCompletitud}%</span>
                      </div>
                      <ProgressBar
                        value={leccion.tasaCompletitud}
                        label={`Tasa de completitud de ${leccion.titulo}`}
                        size="md"
                      />
                    </div>
                  </div>

                  {/* Estadísticas adicionales si es cuestionario */}
                  {esCuestionario && leccion.quizStats && (
                    <div className="mt-2 grid grid-cols-2 gap-3 rounded-lg border border-border/80 bg-surface-muted/40 p-3 sm:grid-cols-4">
                      <div>
                        <span className="block text-xs text-fg-subtle">Nota mínima</span>
                        <span className="text-sm font-semibold text-fg">
                          {leccion.notaMinima ?? 70} / 100
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-fg-subtle">Intentos totales</span>
                        <span className="text-sm font-semibold text-fg">
                          {leccion.quizStats.totalIntentos}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-fg-subtle">Promedio de notas</span>
                        <span className="text-sm font-semibold text-fg">
                          {leccion.quizStats.promedioPuntaje} / 100
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-fg-subtle">Estudiantes aprobados</span>
                        <span className="text-sm font-semibold text-success">
                          {leccion.quizStats.aprobados} de {leccion.quizStats.totalEstudiantes} ({leccion.quizStats.tasaAprobacion}%)
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Sección: Estudiantes inscritos */}
      <section aria-labelledby="seccion-estudiantes" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="seccion-estudiantes" className="text-lg font-bold text-fg sm:text-xl">
              Estudiantes inscritos
            </h2>
            <p className="mt-0.5 text-sm text-fg-muted">
              Listado detallado del avance individual de los estudiantes en este curso.
            </p>
          </div>

          {/* Filtros de estudiantes */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={filterCompletado === undefined ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setFilterCompletado(undefined);
                setStudentPage(1);
              }}
            >
              Todos ({metricas.totalInscritos})
            </Button>
            <Button
              variant={filterCompletado === true ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setFilterCompletado(true);
                setStudentPage(1);
              }}
            >
              Completados ({metricas.totalCompletados})
            </Button>
            <Button
              variant={filterCompletado === false ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setFilterCompletado(false);
                setStudentPage(1);
              }}
            >
              En progreso ({metricas.totalInscritos - metricas.totalCompletados})
            </Button>
          </div>
        </div>

        {/* Buscador de estudiantes */}
        <div className="max-w-md">
          <Input
            label="Buscar estudiante"
            type="search"
            placeholder="Buscar por nombre o correo..."
            autoComplete="off"
            value={studentSearch}
            onChange={(e) => {
              const val = e.target.value;
              setStudentSearch(val);
              handleSearchChange(val);
            }}
          />
        </div>

        {loadingEstudiantes ? (
          <div className="py-8">
            <PageLoader />
          </div>
        ) : errorEstudiantes ? (
          <ErrorMessage
            message={errorEstudiantes.message || 'Error al cargar los estudiantes inscritos'}
            onRetry={refetchEstudiantes}
          />
        ) : estudiantes.length === 0 ? (
          <Card className="py-8">
            <EmptyState
              title={debouncedSearch ? 'Sin resultados para la búsqueda' : 'No hay estudiantes en este estado'}
              description={
                debouncedSearch
                  ? `No se encontraron estudiantes que coincidan con "${debouncedSearch}".`
                  : 'Ningún estudiante cumple con el filtro seleccionado actualmente.'
              }
              action={
                debouncedSearch || filterCompletado !== undefined ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setStudentSearch('');
                      setDebouncedSearch('');
                      setFilterCompletado(undefined);
                      setStudentPage(1);
                    }}
                  >
                    Restablecer filtros
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Tabla en escritorio */}
            <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
              <table className="w-full text-left text-sm text-fg">
                <thead className="border-b border-border bg-surface-muted/50 text-xs font-semibold text-fg-muted uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">
                      Estudiante
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Fecha inscripción
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Progreso
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-center">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {estudiantes.map((item) => (
                    <tr key={item.inscripcionId} className="transition-colors hover:bg-surface-muted/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={item.estudiante.nombre} size="sm" />
                          <div>
                            <div className="font-medium text-fg">{item.estudiante.nombre}</div>
                            <div className="text-xs text-fg-muted">{item.estudiante.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-fg-muted">
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="size-3.5 text-fg-subtle" />
                          {formatDate(item.fechaInscripcion)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex w-44 flex-col gap-1">
                          <div className="flex items-center justify-between text-xs text-fg-muted">
                            <span>
                              {item.leccionesCompletadas} de {item.totalLecciones} lecciones
                            </span>
                            <span className="font-semibold text-fg">{item.porcentaje}%</span>
                          </div>
                          <ProgressBar
                            value={item.porcentaje}
                            label={`Avance de ${item.estudiante.nombre}`}
                            size="sm"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.completado ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircleIcon className="size-3 text-success" />
                            Completado
                          </Badge>
                        ) : (
                          <Badge variant="neutral">
                            En curso
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tarjetas en móvil (REGLAS C.25) */}
            <div className="flex flex-col gap-3 md:hidden">
              {estudiantes.map((item) => (
                <Card key={item.inscripcionId} className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={item.estudiante.nombre} size="sm" />
                      <div>
                        <div className="text-sm font-semibold text-fg">{item.estudiante.nombre}</div>
                        <div className="text-xs text-fg-muted">{item.estudiante.email}</div>
                      </div>
                    </div>
                    {item.completado ? (
                      <Badge variant="success">Completado</Badge>
                    ) : (
                      <Badge variant="neutral">En curso</Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs text-fg-muted">
                      <span>Progreso ({item.leccionesCompletadas}/{item.totalLecciones})</span>
                      <span className="font-semibold text-fg">{item.porcentaje}%</span>
                    </div>
                    <ProgressBar
                      value={item.porcentaje}
                      label={`Avance de ${item.estudiante.nombre}`}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-fg-subtle">
                    <span>Inscrito:</span>
                    <span>{formatDate(item.fechaInscripcion)}</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Paginación */}
            {estudiantesMeta && estudiantesMeta.totalPages > 1 && (
              <Pagination
                meta={estudiantesMeta}
                onPageChange={setStudentPage}
                itemLabel={['estudiante', 'estudiantes']}
                className="mt-2"
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
