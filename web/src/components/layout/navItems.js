import { PATHS } from '@/routes/paths';

/**
 * @typedef {{ to: string, label: string, end?: boolean }} NavItem
 */

/**
 * Enlaces del menú principal.
 * Pendiente (paso 03): ítems según sesión/rol — Catálogo, Mis cursos / Panel, perfil y Salir.
 * @type {NavItem[]}
 */
export const NAV_ITEMS = [{ to: PATHS.home, label: 'Inicio', end: true }];
