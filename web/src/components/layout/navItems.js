import { PATHS } from '@/routes/paths';

/**
 * @typedef {{ to: string, label: string, end?: boolean }} NavItem
 */

/** @type {NavItem} */
const CATALOGO = { to: PATHS.catalogo, label: 'Catálogo' };

/** Enlaces del menú principal según sesión y rol (arreglos fijos: misma referencia en cada render). */
const NAV_ITEMS = Object.freeze({
  invitado: [CATALOGO],
  estudiante: [CATALOGO, { to: PATHS.misCursos, label: 'Mis cursos' }],
  instructor: [CATALOGO, { to: PATHS.instructorCursos, label: 'Panel' }],
});

/** @type {NavItem} */
export const PROFILE_ITEM = { to: PATHS.perfil, label: 'Mi perfil' };

/**
 * @param {import('@/services/authService').Rol | undefined} rol Sin rol = visitante sin sesión.
 * @returns {NavItem[]}
 */
export const getNavItems = (rol) => NAV_ITEMS[rol ?? 'invitado'];
