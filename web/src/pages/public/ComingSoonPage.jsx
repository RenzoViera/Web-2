import { ClockIcon } from '@/components/icons';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Marcador de las secciones que llegan en pasos siguientes (catálogo y mis cursos: paso 06;
 * cursos del instructor: paso 04). Cada paso reemplaza su ruta por la página real.
 * @param {{ title: string }} props
 */
export default function ComingSoonPage({ title }) {
  return (
    <>
      <title>{`${title} · MiniAula`}</title>
      <EmptyState
        title={title}
        description="Estamos preparando esta sección. Muy pronto vas a poder usarla."
        icon={<ClockIcon className="size-10" />}
        className="mt-8"
      />
    </>
  );
}
