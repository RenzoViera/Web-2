import { NavLink } from 'react-router';
import { cn } from '@/utils/cn';

const VARIANTS = {
  bar: 'px-3 py-2',
  menu: 'block px-3 py-2.5',
};

/**
 * @param {{
 *   item: import('./navItems').NavItem,
 *   variant?: keyof typeof VARIANTS,
 *   onNavigate?: () => void,
 * }} props `bar`: barra de escritorio · `menu`: menú móvil.
 */
export function NavItemLink({ item, variant = 'bar', onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'rounded-lg text-sm font-medium transition-colors duration-150',
          VARIANTS[variant],
          isActive ? 'bg-primary-soft text-primary' : 'text-fg-muted hover:bg-surface-muted hover:text-fg',
        )
      }
    >
      {item.label}
    </NavLink>
  );
}
