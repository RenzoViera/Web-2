const VIDEO_FILE_RE = /\.(mp4|webm|ogg|mov)$/i;
const YOUTUBE_ID_RE = /^[\w-]{6,20}$/;
const VIMEO_ID_RE = /^\d+$/;

/**
 * Interpreta una URL de video para mostrar reproductor embebido (YouTube/Vimeo), `<video>` directo o enlace externo.
 * Solo acepta `http:` y `https:`.
 * @param {string | null | undefined} rawUrl
 * @returns {{ kind: 'embed', embedUrl: string, originalUrl: string }
 *   | { kind: 'video', src: string }
 *   | { kind: 'link', href: string }
 *   | null}
 */
export function parseVideoSource(rawUrl) {
  if (!rawUrl || !URL.canParse(rawUrl)) return null;

  const url = new URL(rawUrl);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be' && segments[0] && YOUTUBE_ID_RE.test(segments[0])) {
    return {
      kind: 'embed',
      embedUrl: `https://www.youtube.com/embed/${segments[0]}`,
      originalUrl: rawUrl,
    };
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    let videoId = url.searchParams.get('v');
    if (!videoId && (segments[0] === 'embed' || segments[0] === 'shorts') && segments[1]) {
      videoId = segments[1];
    }
    if (videoId && YOUTUBE_ID_RE.test(videoId)) {
      return {
        kind: 'embed',
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        originalUrl: rawUrl,
      };
    }
  }

  if (host === 'vimeo.com' && segments[0] && VIMEO_ID_RE.test(segments[0])) {
    return {
      kind: 'embed',
      embedUrl: `https://player.vimeo.com/video/${segments[0]}`,
      originalUrl: rawUrl,
    };
  }

  if (host === 'player.vimeo.com' && segments[0] === 'video' && segments[1] && VIMEO_ID_RE.test(segments[1])) {
    return {
      kind: 'embed',
      embedUrl: `https://player.vimeo.com/video/${segments[1]}`,
      originalUrl: rawUrl,
    };
  }

  if (VIDEO_FILE_RE.test(url.pathname)) {
    return { kind: 'video', src: rawUrl };
  }

  return { kind: 'link', href: rawUrl };
}
