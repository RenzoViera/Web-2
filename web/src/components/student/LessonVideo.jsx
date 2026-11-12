import { ExternalLinkIcon } from '@/components/icons';
import { parseVideoSource } from '@/utils/video';

/**
 * Reproductor o enlace seguro para el `videoUrl` de una lección de contenido.
 * @param {{ videoUrl: string, titulo: string }} props
 */
export function LessonVideo({ videoUrl, titulo }) {
  const source = parseVideoSource(videoUrl);
  if (!source) return null;

  if (source.kind === 'embed') {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-black">
        <iframe
          src={source.embedUrl}
          title={`Video de ${titulo}`}
          className="aspect-video w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  if (source.kind === 'video') {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-black">
        <video controls preload="metadata" src={source.src} className="aspect-video w-full">
          <track kind="captions" />
        </video>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">Video externo de la lección</p>
        <p className="truncate text-xs text-fg-muted">{source.href}</p>
      </div>
      <a
        href={source.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-soft"
      >
        Abrir video
        <ExternalLinkIcon className="size-4" />
      </a>
    </div>
  );
}
