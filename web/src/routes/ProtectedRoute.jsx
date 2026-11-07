import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { PATHS } from './paths';
import { buildRedirectState } from './redirectState';

/**
 * Rutas que requieren sesión. Sin usuario redirige a /login recordando la página de origen.
 * También actúa cuando la sesión se cierra estando adentro (p. ej. un 401 por token vencido).
 */
export function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to={PATHS.login} replace state={buildRedirectState(location)} />;
  return <Outlet />;
}
