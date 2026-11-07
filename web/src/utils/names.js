/** @param {string} nombre */
const words = (nombre) => nombre.trim().split(/\s+/).filter(Boolean);

/**
 * Primer nombre: "Juan Pérez" → "Juan".
 * @param {string} nombre
 */
export const getFirstName = (nombre) => words(nombre)[0] ?? nombre;

/**
 * Iniciales del primer y último nombre: "Juan Pérez" → "JP", "Ana" → "A".
 * @param {string} nombre
 */
export const getInitials = (nombre) => {
  const parts = words(nombre);
  const first = [...(parts[0] ?? '')][0] ?? '';
  const last = parts.length > 1 ? ([...parts[parts.length - 1]][0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
};
