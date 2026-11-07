const DATE_FORMAT = new Intl.DateTimeFormat('es', { dateStyle: 'long' });

/**
 * Fecha legible en español: "7 de noviembre de 2026".
 * @param {string | Date} value Fecha ISO 8601 de la API o Date.
 */
export const formatDate = (value) => DATE_FORMAT.format(new Date(value));
