import { LinkButton } from '@/components/ui/LinkButton';
import { PATHS } from '@/routes/paths';

export default function HomePage() {
  return (
    <section className="animate-fade-in py-12 text-center sm:py-20">
      <title>MiniAula</title>
      <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-5xl">Aprende a tu ritmo, lección por lección</h1>
      <p className="mx-auto mt-4 max-w-2xl text-base text-fg-muted sm:text-lg">
        Cursos con avance secuencial y cuestionarios: cada lección se desbloquea cuando completas la anterior.
      </p>
      <LinkButton to={PATHS.catalogo} size="lg" className="mt-8">
        Explorar cursos
      </LinkButton>
    </section>
  );
}
