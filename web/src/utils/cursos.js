/** @typedef {import('@/services/cursosService').NivelCurso} NivelCurso */
/** @typedef {import('@/services/cursosService').EstadoCurso} EstadoCurso */
/** @typedef {import('@/components/ui/Badge').BadgeVariant} BadgeVariant */

/** @type {Readonly<Record<NivelCurso, string>>} */
export const NIVEL_LABELS = Object.freeze({
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
});

/** @type {Readonly<Record<EstadoCurso, { label: string, variant: BadgeVariant }>>} */
export const ESTADO_BADGES = Object.freeze({
  borrador: { label: 'Borrador', variant: 'neutral' },
  publicado: { label: 'Publicado', variant: 'success' },
  archivado: { label: 'Archivado', variant: 'warning' },
});

/**
 * Nivel legible ("intermedio" → "Intermedio").
 * @param {string} nivel
 */
export const nivelLabel = (nivel) => NIVEL_LABELS[/** @type {NivelCurso} */ (nivel)] ?? nivel;
