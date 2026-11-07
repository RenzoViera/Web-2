import { useCallback, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { CloseIcon, LogOutIcon, MenuIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useDismiss } from '@/hooks/useDismiss';
import { PATHS } from '@/routes/paths';
import { GuestActions } from './GuestActions';
import { Logo } from './Logo';
import { NavItemLink } from './NavItemLink';
import { getNavItems, PROFILE_ITEM } from './navItems';
import { UserMenu } from './UserMenu';
import { UserSummary } from './UserSummary';

/**
 * Barra superior responsive según sesión y rol: enlaces y menú de usuario desde 640 px, menú hamburguesa debajo.
 */
export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const headerRef = useRef(/** @type {HTMLElement | null} */ (null));
  const menuButtonRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const close = useCallback(() => setOpen(false), []);
  const items = getNavItems(user?.rol);

  const handleDismiss = useCallback((/** @type {'outside' | 'escape'} */ reason) => {
    setOpen(false);
    if (reason === 'escape') menuButtonRef.current?.focus();
  }, []);

  useDismiss(headerRef, handleDismiss, open);

  // Primero sale de la página (puede ser protegida) y después borra la sesión: así ProtectedRoute no manda a /login.
  const handleLogout = useCallback(async () => {
    close();
    await navigate(PATHS.home);
    logout();
  }, [close, navigate, logout]);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <nav aria-label="Principal" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo onNavigate={close} />

        <div className="hidden items-center gap-3 sm:flex">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.to}>
                <NavItemLink item={item} />
              </li>
            ))}
          </ul>
          <div className="h-6 w-px bg-border" aria-hidden="true" />
          {user ? <UserMenu user={user} onLogout={handleLogout} /> : <GuestActions />}
        </div>

        <Button
          ref={menuButtonRef}
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </Button>
      </nav>

      <div id={menuId} hidden={!open} className="animate-slide-down border-t border-border bg-surface sm:hidden">
        <ul className="flex flex-col gap-1 px-4 py-3">
          {items.map((item) => (
            <li key={item.to}>
              <NavItemLink item={item} variant="menu" onNavigate={close} />
            </li>
          ))}
        </ul>
        <div className="border-t border-border px-4 py-3">
          {user ? (
            <div className="flex flex-col gap-1">
              <div className="px-2 pb-3">
                <UserSummary user={user} />
              </div>
              <NavItemLink item={PROFILE_ITEM} variant="menu" onNavigate={close} />
              <Button variant="menu" fullWidth onClick={handleLogout}>
                <LogOutIcon className="size-4" />
                Cerrar sesión
              </Button>
            </div>
          ) : (
            <GuestActions stacked onNavigate={close} />
          )}
        </div>
      </div>
    </header>
  );
}
