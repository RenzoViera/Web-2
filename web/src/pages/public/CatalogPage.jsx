import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { CategoryFilter } from '@/components/cursos/CategoryFilter';
import { CourseCard } from '@/components/cursos/CourseCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { useFetch } from '@/hooks/useFetch';
import { cursosService } from '@/services/cursosService';
import { cn } from '@/utils/cn';
import { pluralize } from '@/utils/format';

/** @typedef {import('@/services/cursosService').CursoCatalogo} CursoCatalogo */
/** @typedef {import('@/services/cursosService').PaginatedResponse<CursoCatalogo>} CatalogoResponse */

const LIMIT = 9;
const SEARCH_DELAY_MS = 300;

/** @param {string | null} value */
const toPage = (value) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

/**
 * Catálogo público: búsqueda por título (debounce), chips de categoría y paginación. Los filtros viven en la
 * URL (`?q=&categoria=&page=`) para compartir el enlace y volver atrás.
 */
export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const categoria = searchParams.get('categoria') ?? '';
  const page = toPage(searchParams.get('page'));
  const hayFiltros = q !== '' || categoria !== '';

  /**
   * Cambia claves de la URL (`''`/`null` las quita). Los filtros no mueven el scroll; la paginación sí.
   * @param {Record<string, string | number | null>} changes
   * @param {{ replace?: boolean, preventScrollReset?: boolean }} [options]
   */
  const updateParams = (changes, options = {}) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, String(value));
      }
      return next;
    }, options);
  };

  // El texto del buscador se sincroniza con `q` cuando la URL cambia desde afuera (atrás/adelante, limpiar).
  const [texto, setTexto] = useState(q);
  const [qVigente, setQVigente] = useState(q);
  if (q !== qVigente) {
    setQVigente(q);
    if (q !== texto.trim()) setTexto(q);
  }

  const buscar = useDebouncedCallback(
    /** @param {string} valor */
    (valor) => updateParams({ q: valor.trim(), page: null }, { replace: true, preventScrollReset: true }),
    SEARCH_DELAY_MS,
  );

  const catalogo = useFetch(
    ({ signal }) =>
      cursosService.getCursos(
        { q: q || undefined, categoria: categoria || undefined, page, limit: LIMIT },
        { signal },
      ),
    [q, categoria, page],
  );

  const limpiarFiltros = () => {
    setTexto('');
    updateParams({ q: null, categoria: null, page: null }, { preventScrollReset: true });
  };

  return (
    <div className="mx-auto flex max-w-6xl animate-fade-in flex-col gap-6">
      <title>Catálogo de cursos · MiniAula</title>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Catálogo de cursos</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Encuentra un curso y avanza lección por lección a tu ritmo.
        </p>
      </header>

      <section aria-label="Filtros" className="flex flex-col gap-4">
        <Input
          label="Buscar por título"
          type="search"
          placeholder="Ej.: JavaScript"
          autoComplete="off"
          value={texto}
          onChange={(event) => {
            setTexto(event.target.value);
            buscar(event.target.value);
          }}
          className="w-full sm:max-w-sm"
        />
        <CategoryChips
          selected={categoria}
          onChange={(value) => updateParams({ categoria: value, page: null }, { preventScrollReset: true })}
        />
      </section>

      <CatalogResults
        state={catalogo}
        page={page}
        hayFiltros={hayFiltros}
        onClearFilters={limpiarFiltros}
        onPageChange={(nextPage) => updateParams({ page: nextPage === 1 ? null : nextPage })}
      />
    </div>
  );
}

/**
 * Chips con las categorías publicadas: sección independiente con su propio estado de carga y error (C.27).
 * @param {{ selected: string, onChange: (categoria: string) => void }} props
 */
function CategoryChips({ selected, onChange }) {
  const { data, loading, error, refetch } = useFetch(() => cursosService.getCategorias(), []);

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        {['w-16', 'w-28', 'w-24', 'w-32'].map((width) => (
          <span key={width} className={cn('h-8 rounded-full bg-surface-muted', width)} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
        No se pudieron cargar las categorías.
        <Button variant="ghost" size="sm" onClick={refetch}>
          Reintentar
        </Button>
      </div>
    );
  }

  const categorias = data?.data ?? [];
  // Una categoría que llega por URL y ya no tiene cursos publicados sigue visible para poder quitarla.
  const opciones = selected && !categorias.includes(selected) ? [...categorias, selected] : categorias;
  return <CategoryFilter categorias={opciones} value={selected} onChange={onChange} />;
}

/**
 * Grilla de resultados con sus estados de carga, error y vacío.
 * @param {{
 *   state: { data: CatalogoResponse | null, loading: boolean, error: Error | null, refetch: () => Promise<void> },
 *   page: number,
 *   hayFiltros: boolean,
 *   onClearFilters: () => void,
 *   onPageChange: (page: number) => void,
 * }} props
 */
function CatalogResults({ state, page, hayFiltros, onClearFilters, onPageChange }) {
  const { data, loading, error, refetch } = state;

  if (loading) {
    return (
      <div className="grid min-h-64 place-items-center">
        <Spinner size="lg" label="Cargando cursos…" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage title="No se pudieron cargar los cursos" message={error.message} onRetry={refetch} />;
  }

  const cursos = data?.data ?? [];
  const meta = data?.meta;

  if (cursos.length === 0) {
    if (page > 1 && meta && meta.total > 0) {
      return (
        <EmptyState
          title="Esta página no tiene cursos"
          action={
            <Button variant="secondary" size="sm" onClick={() => onPageChange(1)}>
              Ir a la primera página
            </Button>
          }
        />
      );
    }
    return hayFiltros ? (
      <EmptyState
        title="No encontramos cursos con esos filtros"
        description="Prueba con otra palabra o elige otra categoría."
        action={
          <Button variant="secondary" size="sm" onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        }
      />
    ) : (
      <EmptyState title="Aún no hay cursos publicados" description="Vuelve pronto: se están preparando nuevos cursos." />
    );
  }

  return (
    <section aria-label="Resultados" className="flex flex-col gap-6">
      <p className="sr-only" aria-live="polite">
        {pluralize(meta?.total ?? cursos.length, 'curso encontrado', 'cursos encontrados')}
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cursos.map((curso) => (
          <CourseCard key={curso.id} curso={curso} />
        ))}
      </div>
      {meta && <Pagination meta={meta} onPageChange={onPageChange} itemLabel={['curso', 'cursos']} />}
    </section>
  );
}
