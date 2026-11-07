import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { RouteErrorBoundary } from '@/components/errors/RouteErrorBoundary';
import { Layout } from '@/components/layout/Layout';
import { ROLES } from '@/utils/roles';
import { GuestRoute } from './GuestRoute';
import { PATHS } from './paths';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

const HomePage = lazy(() => import('@/pages/public/HomePage'));
const LoginPage = lazy(() => import('@/pages/public/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/public/RegisterPage'));
const ProfilePage = lazy(() => import('@/pages/account/ProfilePage'));
const ComingSoonPage = lazy(() => import('@/pages/public/ComingSoonPage'));
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'));
const InstructorCoursesPage = lazy(() => import('@/pages/instructor/InstructorCoursesPage'));
const CourseEditorPage = lazy(() => import('@/pages/instructor/CourseEditorPage'));

/*
 * Pendiente: páginas reales del instructor (04, 05, 09) y del estudiante (06, 07, 08); reemplazan a ComingSoonPage
 * o se suman como hijas del RoleRoute de su rol.
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
          { path: PATHS.catalogo, element: <ComingSoonPage title="Catálogo de cursos" /> },
          {
            element: <GuestRoute />,
            children: [
              { path: PATHS.login, element: <LoginPage /> },
              { path: PATHS.registro, element: <RegisterPage /> },
            ],
          },
          {
            element: <ProtectedRoute />,
            children: [
              { path: PATHS.perfil, element: <ProfilePage /> },
              {
                element: <RoleRoute roles={[ROLES.ESTUDIANTE]} />,
                children: [{ path: PATHS.misCursos, element: <ComingSoonPage title="Mis cursos" /> }],
              },
              {
                element: <RoleRoute roles={[ROLES.INSTRUCTOR]} />,
                children: [
                  { path: PATHS.instructorCursos, element: <InstructorCoursesPage /> },
                  { path: PATHS.instructorNuevoCurso, element: <CourseEditorPage /> },
                  { path: PATHS.instructorEditarCurso, element: <CourseEditorPage /> },
                ],
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
