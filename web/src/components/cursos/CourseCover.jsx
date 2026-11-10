import { PresentationIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

/**
 * Portada 16:9 de un curso: su imagen o, si no tiene, un marcador con ícono.
 * @param {{ imagenUrl?: string | null, alt?: string, className?: string }} props
 *   `alt` vacío por defecto: la portada acompaña al título, que ya nombra el curso.
 */
export function CourseCover({ imagenUrl, alt = '', className }) {
  if (!imagenUrl) {
    return (
      <div
        className={cn('flex aspect-video w-full items-center justify-center bg-surface-muted text-fg-subtle', className)}
      >
        <PresentationIcon className="size-12 opacity-40" />
      </div>
    );
  }

  return (
    <div className={cn('aspect-video w-full overflow-hidden bg-surface-muted', className)}>
      <img src={imagenUrl} alt={alt} loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
}
