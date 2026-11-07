import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ROLE_LABELS } from '@/utils/roles';

/**
 * Avatar, nombre, email y rol del usuario en sesión (menú de usuario y menú móvil).
 * @param {{ user: import('@/services/authService').Usuario }} props
 */
export function UserSummary({ user }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={user.nombre} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-fg">{user.nombre}</p>
        <p className="truncate text-xs text-fg-muted">{user.email}</p>
        <Badge variant="primary" className="mt-1.5">
          {ROLE_LABELS[user.rol]}
        </Badge>
      </div>
    </div>
  );
}
