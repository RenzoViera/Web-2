import { LinkButton } from '@/components/ui/LinkButton';
import { PATHS } from '@/routes/paths';
import { cn } from '@/utils/cn';

/**
 * Accesos para visitantes sin sesión: iniciar sesión y crear cuenta.
 * @param {{ stacked?: boolean, onNavigate?: () => void }} props `stacked`: apilados a todo el ancho (menú móvil).
 */
export function GuestActions({ stacked = false, onNavigate }) {
  return (
    <div className={cn('flex gap-2', stacked && 'flex-col')}>
      <LinkButton to={PATHS.login} variant={stacked ? 'secondary' : 'ghost'} fullWidth={stacked} onClick={onNavigate}>
        Iniciar sesión
      </LinkButton>
      <LinkButton to={PATHS.registro} fullWidth={stacked} onClick={onNavigate}>
        Crear cuenta
      </LinkButton>
    </div>
  );
}
