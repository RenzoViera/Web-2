import { useCallback, useId, useRef, useState } from 'react';
import { CloseIcon, MenuIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useDismiss } from '@/hooks/useDismiss';
import { Logo } from './Logo';
import { NavItemLink } from './NavItemLink';
import { NAV_ITEMS } from './navItems';

/** Barra superior responsive: enlaces en línea desde 640 px, menú hamburguesa debajo. */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const headerRef = useRef(/** @type {HTMLElement | null} */ (null));
  const close = useCallback(() => setOpen(false), []);

  useDismiss(headerRef, close, open);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <nav aria-label="Principal" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo onNavigate={close} />

        <ul className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavItemLink item={item} />
            </li>
          ))}
        </ul>

        <Button
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
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavItemLink item={item} variant="menu" onNavigate={close} />
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
