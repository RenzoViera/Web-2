const DATE_FORMAT = new Intl.DateTimeFormat('es', { dateStyle: 'long' });

/**
 * Fecha legible en español: "7 de noviembre de 2026".
 * @param {string | Date} value Fecha ISO 8601 de la API o Date.
 */
export const formatDate = (value) => DATE_FORMAT.format(new Date(value));

/**
 * Cantidad con su sustantivo en singular o plural: `pluralize(1, 'lección', 'lecciones')` → "1 lección".
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 */
export const pluralize = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;
