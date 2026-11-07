import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { homePathFor } from './paths';
import { getRedirectPath } from './redirectState';

/**
 * Login y registro: solo sin sesión. Al iniciar sesión o registrarse redirige a la página de origen
 * (si la había) o al inicio del rol; las páginas no navegan por su cuenta.
 */
export function GuestRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (user) return <Navigate to={getRedirectPath(location.state) ?? homePathFor(user.rol)} replace />;
  return <Outlet />;
}
