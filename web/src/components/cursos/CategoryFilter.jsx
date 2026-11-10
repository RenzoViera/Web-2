import { Button } from '@/components/ui/Button';

const TODAS = '';

/**
 * Chips de categoría del catálogo (selección única; "Todas" quita el filtro). Cada chip es un `Button` con
 * `aria-pressed`. En móvil hacen wrap (REGLAS C.25).
 * @param {{
 *   categorias: string[],
 *   value: string,
 *   onChange: (categoria: string) => void,
 * }} props `value` vacío = todas.
 */
export function CategoryFilter({ categorias, value, onChange }) {
  const opciones = [{ value: TODAS, label: 'Todas' }, ...categorias.map((categoria) => ({ value: categoria, label: categoria }))];

  return (
    <div role="group" aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
      {opciones.map((opcion) => {
        const selected = opcion.value === value;
        return (
          <Button
            key={opcion.value || 'todas'}
            variant={selected ? 'primary' : 'secondary'}
            size="sm"
            aria-pressed={selected}
            className="rounded-full"
            onClick={() => onChange(opcion.value)}
          >
            {opcion.label}
          </Button>
        );
      })}
    </div>
  );
}
