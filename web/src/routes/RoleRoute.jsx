import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { homePathFor, PATHS } from './paths';

/**
 * Restringe por rol; va dentro de ProtectedRoute. Con otro rol redirige al inicio de su rol.
 * La API vuelve a verificar el rol en cada endpoint (403): esto solo ordena la navegación.
 * @param {{ roles: ReadonlyArray<import('@/services/authService').Rol> }} props
 */
export function RoleRoute({ roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to={PATHS.login} replace />;
  if (!roles.includes(user.rol)) return <Navigate to={homePathFor(user.rol)} replace />;
  return <Outlet />;
}
