import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { RouteErrorBoundary } from '@/components/errors/RouteErrorBoundary';
import { Layout } from '@/components/layout/Layout';
import { PATHS } from './paths';

const HomePage = lazy(() => import('@/pages/public/HomePage'));
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'));

/*
 * Pendiente: rutas de auth (paso 03, con ProtectedRoute/RoleRoute), instructor (04, 05, 09)
 * y estudiante (06, 07, 08). Se agregan como hijas del grupo con errorElement inline.
 */
const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteErrorBoundary variant="page" />,
    children: [
      {
        // Errores de una página se muestran dentro del layout (la navbar sigue visible).
        errorElement: <RouteErrorBoundary />,
        children: [
          { path: PATHS.home, element: <HomePage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
