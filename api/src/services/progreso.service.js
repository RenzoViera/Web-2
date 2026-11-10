/**
 * Única fórmula del porcentaje de avance de una inscripción (Mis cursos, vista de lección y panel del instructor).
 * Un curso sin lecciones cuenta como 0 %.
 * @param {number} completadas Lecciones completadas (cuestionario completado = aprobado, RN-01).
 * @param {number} total Lecciones del curso.
 * @returns {number} Entero de 0 a 100.
 */
export const calcularPorcentaje = (completadas, total) => {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((completadas / total) * 100));
};
