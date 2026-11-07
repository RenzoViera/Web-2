import { useCallback, useId, useRef, useState } from 'react';
import { ChevronDownIcon, LogOutIcon } from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useDismiss } from '@/hooks/useDismiss';
import { cn } from '@/utils/cn';
import { getFirstName } from '@/utils/names';
import { NavItemLink } from './NavItemLink';
import { PROFILE_ITEM } from './navItems';
import { UserSummary } from './UserSummary';

/**
 * Menú de usuario de escritorio (patrón disclosure): avatar con iniciales → datos, Mi perfil y Cerrar sesión.
 * Se cierra con clic afuera o Escape (el foco vuelve al botón).
 * @param {{ user: import('@/services/authService').Usuario, onLogout: () => Promise<void> }} props
 */
export function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const buttonRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const close = useCallback(() => setOpen(false), []);

  const handleDismiss = useCallback((/** @type {'outside' | 'escape'} */ reason) => {
    setOpen(false);
    if (reason === 'escape') buttonRef.current?.focus();
  }, []);

  useDismiss(containerRef, handleDismiss, open);

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <Avatar name={user.nombre} size="sm" />
        <span className="max-w-32 truncate">{getFirstName(user.nombre)}</span>
        <span className="sr-only">: menú de usuario</span>
        <ChevronDownIcon className={cn('size-4 transition-transform duration-150', open && 'rotate-180')} />
      </Button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute top-full right-0 z-50 mt-2 w-72 animate-slide-down rounded-xl border border-border bg-surface p-2 shadow-lg"
      >
        <div className="border-b border-border px-2 pt-2 pb-3">
          <UserSummary user={user} />
        </div>
        <ul className="flex flex-col gap-1 pt-2">
          <li>
            <NavItemLink item={PROFILE_ITEM} variant="menu" onNavigate={close} />
          </li>
          <li>
            <Button
              variant="menu"
              fullWidth
              onClick={() => {
                close();
                return onLogout();
              }}
            >
              <LogOutIcon className="size-4" />
              Cerrar sesión
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
}
