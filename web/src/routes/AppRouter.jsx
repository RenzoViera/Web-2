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
const CatalogPage = lazy(() => import('@/pages/public/CatalogPage'));
const CourseDetailPage = lazy(() => import('@/pages/public/CourseDetailPage'));
const LoginPage = lazy(() => import('@/pages/public/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/public/RegisterPage'));
const ProfilePage = lazy(() => import('@/pages/account/ProfilePage'));
const ComingSoonPage = lazy(() => import('@/pages/public/ComingSoonPage'));
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'));
const InstructorCoursesPage = lazy(() => import('@/pages/instructor/InstructorCoursesPage'));
const CourseEditorPage = lazy(() => import('@/pages/instructor/CourseEditorPage'));
const LessonEditorPage = lazy(() => import('@/pages/instructor/LessonEditorPage'));
const QuestionModalPage = lazy(() => import('@/pages/instructor/QuestionModalPage'));
const MyCoursesPage = lazy(() => import('@/pages/student/MyCoursesPage'));

/*
 * Pendiente: vista de lección (07, hoy ComingSoonPage), cuestionario (08) y panel del instructor (09);
 * reemplazan a ComingSoonPage o se suman como hijas del RoleRoute de su rol.
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
          { path: PATHS.catalogo, element: <CatalogPage /> },
          { path: PATHS.cursoDetalle, element: <CourseDetailPage /> },
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
                children: [
                  { path: PATHS.misCursos, element: <MyCoursesPage /> },
                  { path: PATHS.leccion, element: <ComingSoonPage title="Lección" /> },
                ],
              },
              {
                element: <RoleRoute roles={[ROLES.INSTRUCTOR]} />,
                children: [
                  { path: PATHS.instructorCursos, element: <InstructorCoursesPage /> },
                  { path: PATHS.instructorNuevoCurso, element: <CourseEditorPage /> },
                  { path: PATHS.instructorEditarCurso, element: <CourseEditorPage /> },
                  { path: PATHS.instructorNuevaLeccion, element: <LessonEditorPage /> },
                  {
                    // El modal de pregunta es ruta hija: el editor de lección queda detrás (REGLAS C.40).
                    path: PATHS.instructorEditarLeccion,
                    element: <LessonEditorPage />,
                    children: [
                      { path: PATHS.instructorNuevaPregunta, element: <QuestionModalPage /> },
                      { path: PATHS.instructorEditarPregunta, element: <QuestionModalPage /> },
                    ],
                  },
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
