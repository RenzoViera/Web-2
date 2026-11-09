/**
 * Reglas de validación de formularios para `useAppForm`. Cada regla devuelve el mensaje de error o `undefined`.
 * La API vuelve a validar todo: estas reglas solo dan feedback inmediato.
 *
 * @typedef {(value: unknown, values: Record<string, unknown>) => string | undefined} Rule
 * @typedef {Record<string, Rule[]>} FormRules
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** @param {unknown} value */
const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

/**
 * @param {string} message
 * @returns {Rule}
 */
export const required = (message) => (value) => (isBlank(value) ? message : undefined);

/**
 * @param {string} message
 * @returns {Rule}
 */
export const email = (message) => (value) =>
  !isBlank(value) && !EMAIL_PATTERN.test(String(value).trim()) ? message : undefined;

/**
 * @param {number} min
 * @param {string} message
 * @returns {Rule}
 */
export const minLength = (min, message) => (value) =>
  !isBlank(value) && String(value).length < min ? message : undefined;

/**
 * @param {number} max
 * @param {string} message
 * @returns {Rule}
 */
export const maxLength = (max, message) => (value) => (String(value ?? '').length > max ? message : undefined);

/**
 * URL http(s) válida (vacío permitido: combinar con `required` si es obligatoria).
 * @param {string} message
 * @returns {Rule}
 */
export const url = (message) => (value) => {
  if (isBlank(value)) return undefined;
  const text = String(value).trim();
  return URL.canParse(text) && /^https?:\/\//i.test(text) ? undefined : message;
};

/**
 * Entero dentro de [min, max] (vacío permitido: combinar con `required` si es obligatorio).
 * @param {number} min
 * @param {number} max
 * @param {string} message
 * @returns {Rule}
 */
export const integerRange = (min, max, message) => (value) => {
  if (isBlank(value)) return undefined;
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? undefined : message;
};

/**
 * Aplica las reglas solo cuando se cumple la condición (p. ej. campos que dependen de otro).
 * @param {(values: Record<string, unknown>) => boolean} condition
 * @param {Rule[]} rules
 * @returns {Rule}
 */
export const when = (condition, rules) => (value, values) => {
  if (!condition(values)) return undefined;
  for (const rule of rules) {
    const message = rule(value, values);
    if (message) return message;
  }
  return undefined;
};

/**
 * Primer error de un campo según sus reglas.
 * @param {FormRules} rules
 * @param {string} name
 * @param {Record<string, unknown>} values
 * @returns {string | undefined}
 */
export const validateField = (rules, name, values) => {
  for (const rule of rules[name] ?? []) {
    const message = rule(values[name], values);
    if (message) return message;
  }
  return undefined;
};

/**
 * Resolver de React Hook Form construido a partir de las reglas por campo.
 * @param {FormRules} rules
 * @returns {import('react-hook-form').Resolver<any>}
 */
export const createResolver = (rules) => async (values) => {
  /** @type {Record<string, { type: string, message: string }>} */
  const errors = {};
  for (const name of Object.keys(rules)) {
    const message = validateField(rules, name, values);
    if (message) errors[name] = { type: 'validate', message };
  }
  return Object.keys(errors).length > 0 ? { values: {}, errors } : { values, errors: {} };
};
