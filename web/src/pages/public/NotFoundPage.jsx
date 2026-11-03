import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';
import { PATHS } from '@/routes/paths';

export default function NotFoundPage() {
  return (
    <>
      <title>Página no encontrada · MiniAula</title>
      <EmptyState
        title="Página no encontrada"
        description="La dirección que buscas no existe o fue movida."
        icon={<span className="text-5xl font-bold text-primary">404</span>}
        action={<LinkButton to={PATHS.home}>Volver al inicio</LinkButton>}
        className="mt-8"
      />
    </>
  );
}
