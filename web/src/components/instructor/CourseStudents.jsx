import { useState } from 'react';
import { CheckCircleIcon } from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Spinner } from '@/components/ui/Spinner';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { useFetch } from '@/hooks/useFetch';
import { instructorService } from '@/services/instructorService';
import { formatDate } from '@/utils/format';

/** @typedef {import('@/services/instructorService').EstudianteInscritoItem} EstudianteInscritoItem */

const STUDENTS_PER_PAGE = 10;
const SEARCH_DELAY_MS = 300;

/** @typedef {boolean | undefined} FiltroCompletado */

/**
 * Estudiantes inscritos en un curso: búsqueda (debounce), filtro por estado y paginación. Es una sección independiente
 * del resto del panel: sus filtros no vuelven a pedir las métricas (REGLAS C.14 / C.27).
 * @param {{ cursoId: number, totalInscritos: number, totalCompletados: number }} props
 */
export function CourseStudents({ cursoId, totalInscritos, totalCompletados }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [completado, setCompletado] = useState(/** @type {FiltroCompletado} */ (undefined));

  const applySearch = useDebouncedCallback(
    /** @param {string} value */
    (value) => {
      setDebouncedSearch(value);
      setPage(1);
    },
    SEARCH_DELAY_MS,
  );

  const { data, loading, error, refetch } = useFetch(
    ({ signal }) =>
      instructorService.getCursoEstudiantes(
        cursoId,
        { page, limit: STUDENTS_PER_PAGE, q: debouncedSearch || undefined, completado },
        { signal },
      ),
    [cursoId, page, debouncedSearch, completado],
  );

  const filtros = /** @type {Array<{ label: string, value: FiltroCompletado }>} */ ([
    { label: `Todos (${totalInscritos})`, value: undefined },
    { label: `Completados (${totalCompletados})`, value: true },
    { label: `En progreso (${totalInscritos - totalCompletados})`, value: false },
  ]);

  /** @param {FiltroCompletado} value */
  const changeFilter = (value) => {
    setCompletado(value);
    setPage(1);
  };

  const resetFilters = () => {
    applySearch(''); // reemplaza una búsqueda pendiente del debounce
    setSearch('');
    setDebouncedSearch('');
    changeFilter(undefined);
  };

  const estudiantes = data?.data ?? [];
  const hayFiltros = Boolean(debouncedSearch) || completado !== undefined;

  return (
    <section aria-labelledby="seccion-estudiantes" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="seccion-estudiantes" className="text-lg font-bold text-fg sm:text-xl">
            Estudiantes inscritos
          </h2>
          <p className="mt-0.5 text-sm text-fg-muted">Avance individual de cada estudiante en este curso.</p>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
          {filtros.map((filtro) => (
            <Button
              key={filtro.label}
              size="sm"
              variant={completado === filtro.value ? 'primary' : 'secondary'}
              aria-pressed={completado === filtro.value}
              onClick={() => changeFilter(filtro.value)}
            >
              {filtro.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="w-full sm:max-w-md">
        <Input
          label="Buscar estudiante"
          type="search"
          placeholder="Nombre o correo…"
          autoComplete="off"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            applySearch(event.target.value);
          }}
        />
      </div>

      {loading ? (
        <div className="grid min-h-40 place-items-center">
          <Spinner size="lg" label="Cargando estudiantes…" />
        </div>
      ) : error ? (
        <ErrorMessage message={error.message} onRetry={refetch} />
      ) : estudiantes.length === 0 ? (
        <EmptyState
          title={debouncedSearch ? 'Sin resultados para la búsqueda' : 'No hay estudiantes en este estado'}
          description={
            debouncedSearch
              ? `Ningún estudiante coincide con "${debouncedSearch}".`
              : 'Ningún estudiante cumple con el filtro seleccionado.'
          }
          action={
            hayFiltros && (
              <Button size="sm" variant="secondary" onClick={resetFilters}>
                Restablecer filtros
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <StudentsTable estudiantes={estudiantes} />
          <ul className="flex flex-col gap-3 md:hidden">
            {estudiantes.map((item) => (
              <li key={item.inscripcionId}>
                <StudentCard item={item} />
              </li>
            ))}
          </ul>
          {data && (
            <Pagination meta={data.meta} onPageChange={setPage} itemLabel={['estudiante', 'estudiantes']} />
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Tabla de escritorio; en móvil cada fila pasa a `StudentCard` (REGLAS C.25).
 * @param {{ estudiantes: EstudianteInscritoItem[] }} props
 */
function StudentsTable({ estudiantes }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
      <table className="w-full text-left text-sm text-fg">
        <thead className="border-b border-border bg-surface-muted/50 text-xs font-semibold tracking-wider text-fg-muted uppercase">
          <tr>
            <th scope="col" className="px-6 py-3.5">Estudiante</th>
            <th scope="col" className="px-6 py-3.5">Inscripción</th>
            <th scope="col" className="px-6 py-3.5">Progreso</th>
            <th scope="col" className="px-6 py-3.5 text-center">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {estudiantes.map((item) => (
            <tr key={item.inscripcionId}>
              <td className="px-6 py-4">
                <StudentIdentity estudiante={item.estudiante} />
              </td>
              <td className="px-6 py-4 text-xs text-fg-muted">{formatDate(item.fechaInscripcion)}</td>
              <td className="px-6 py-4">
                <StudentProgress item={item} className="w-44" />
              </td>
              <td className="px-6 py-4 text-center">
                <StudentStatus completado={item.completado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** @param {{ item: EstudianteInscritoItem }} props */
function StudentCard({ item }) {
  return (
    <Card padding="sm" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <StudentIdentity estudiante={item.estudiante} />
        <StudentStatus completado={item.completado} />
      </div>
      <StudentProgress item={item} />
      <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-fg-subtle">
        <span>Inscripción</span>
        <span>{formatDate(item.fechaInscripcion)}</span>
      </div>
    </Card>
  );
}

/** @param {{ estudiante: EstudianteInscritoItem['estudiante'] }} props */
function StudentIdentity({ estudiante }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={estudiante.nombre} size="sm" />
      <div className="min-w-0">
        <p className="truncate font-medium text-fg">{estudiante.nombre}</p>
        <p className="truncate text-xs text-fg-muted">{estudiante.email}</p>
      </div>
    </div>
  );
}

/** @param {{ item: EstudianteInscritoItem, className?: string }} props */
function StudentProgress({ item, className }) {
  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-fg-muted">
        <span>
          {item.leccionesCompletadas} de {item.totalLecciones} lecciones
        </span>
        <span className="font-semibold text-fg">{item.porcentaje}%</span>
      </div>
      <ProgressBar value={item.porcentaje} label={`Avance de ${item.estudiante.nombre}`} size="sm" />
    </div>
  );
}

/** @param {{ completado: boolean }} props */
function StudentStatus({ completado }) {
  return completado ? (
    <Badge variant="success" className="gap-1">
      <CheckCircleIcon className="size-3 text-success" />
      Completado
    </Badge>
  ) : (
    <Badge variant="neutral">En curso</Badge>
  );
}
