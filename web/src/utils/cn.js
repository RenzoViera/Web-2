/**
 * Une clases condicionales ignorando valores falsy.
 * @param {...(string | false | null | undefined)} classes
 */
export const cn = (...classes) => classes.filter(Boolean).join(' ');
