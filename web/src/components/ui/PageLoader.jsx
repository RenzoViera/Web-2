import { Spinner } from './Spinner';

/** Indicador de carga de una página completa (fallback de rutas lazy). */
export function PageLoader() {
  return (
    <div className="grid min-h-64 place-items-center">
      <Spinner size="lg" label="Cargando página…" />
    </div>
  );
}
