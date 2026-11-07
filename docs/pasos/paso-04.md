# Paso 04 — Cursos del instructor (API + Web)

**Responsable:** Paye · **Rama:** `paso-04-cursos` · **Fecha:** 2026-11-07

## Qué se hizo

### Backend (`api/`)
- `validators/curso.validator.js`: esquemas Zod para creación (`createCursoSchema`), edición con al menos un campo (`updateCursoSchema`), cambio de estado (`changeEstadoSchema`) y consulta del catálogo (`catalogoQuerySchema`).
- `repositories/curso.repository.js`:
  - `findById`, `create`, `update`, `updateEstado`, `deleteById`.
  - `countInscripciones` y `countLecciones`.
  - `findInstructorCursos`: consulta paginada con conteos de lecciones e inscritos calculados directamente por subconsulta SQL sin problemas de N+1 (`COUNT(*)::int`).
  - `findInstructorCursoById`: detalle completo con lecciones ordenadas y preguntas con `indiceCorrecto` para el editor del instructor dueño (según duda resuelta §6).
  - `findPublicados`: catálogo de solo cursos publicados con búsqueda case-insensitive en título (`Op.iLike`), filtros por categoría/nivel, conteo de lecciones y paginación.
  - `findPublicadoById`: detalle público de curso publicado con temario resumido (sin contenido sensible, videoUrl ni preguntas).
- `services/curso.service.js`:
  - `crearCurso`: fuerza estado inicial `borrador` y asigna `instructorId` de la sesión.
  - `cambiarEstado`: valida la regla **RN-05** (no se puede publicar un curso sin lecciones → 422 `COURSE_CANNOT_PUBLISH_EMPTY`).
  - `eliminarCurso`: valida la regla **RN-06** (no se puede eliminar un curso que tiene estudiantes inscritos → 409 `COURSE_HAS_STUDENTS`).
  - Regla **RN-07**: el instructor solo administra sus propios cursos.
- `middlewares/isCourseOwner.js`: valida existencia del curso (404) y pertenencia al instructor autenticado (403). Reutilizable en pasos futuros.
- `controllers/curso.controller.js` y routers `curso.routes.js` e `instructor.routes.js` montados bajo `/api/cursos` y `/api/instructor`.
- `api/docs/openapi.yaml`: especificación OpenAPI actualizada con todas las rutas y esquemas de cursos e instructor.
- Actualización de documentación en `docs/api/endpoints.md`, `docs/api/backend.md` y `docs/api/seguridad.md`.

### Frontend (`web/`)
- `services/cursosService.js`: cliente para catálogo, detalle público, listado del instructor, detalle para editor, creación, actualización, cambio de estado y eliminación.
- `hooks/useFetch.js`: hook personalizado para peticiones remotas con soporte de cancelación (`AbortController`), estados `loading`, `error`, `data` y función `refetch`.
- `components/ui/Select.jsx`: desplegable personalizado accesible (C.37) con soporte de teclado (flechas, Enter, Espacio, Home, End, Esc), ARIA combobox/listbox y cierre con `useDismiss`.
- `components/ui/ConfirmDialog.jsx`: modal de confirmación accesible (C.11) para acciones destructivas como eliminar curso.
- `components/ui/Badge.jsx`: soporte de variantes semánticas con contraste accesible (`success`, `warning`, `danger`, `primary`, `neutral`).
- `components/icons/index.jsx`: íconos adicionales `PlusIcon`, `TrashIcon`, `EditIcon`, `ArrowLeftIcon`, `UsersIcon`, `CheckIcon`.
- Páginas:
  - `pages/instructor/InstructorCoursesPage.jsx`: listado de mis cursos con badges de estado y nivel, métricas de lecciones/inscritos, estados de carga/error/vacío y paginación.
  - `pages/instructor/CourseEditorPage.jsx`: formulario de creación/edición con `useAppForm`, cambio de estado con validaciones (Publicar/Archivar), eliminación con diálogo de confirmación y feedback de errores de la API (409/422). Columna derecha de lecciones con aviso del paso 05.
- `routes/AppRouter.jsx` y `routes/paths.js`: rutas integradas bajo `RoleRoute` de instructor (`/instructor/cursos`, `/instructor/cursos/nuevo`, `/instructor/cursos/:id/editar`).

## Cómo probar

1. Iniciar sesión como instructor (`instructor@miniaula.com` / `Password123!`).
2. Navegar a **Mis cursos** (`/instructor/cursos`).
3. Verificar que se listan los cursos del seed con su estado, nivel, lecciones e inscritos.
4. Hacer clic en **Nuevo curso**:
   - Crear un curso completando título, categoría, nivel y descripción.
   - Guardar: el curso se crea en estado **Borrador**.
5. Intentar hacer clic en **Publicar curso**:
   - Se muestra el error 422: *"No se puede publicar un curso sin lecciones"* (RN-05).
6. Abrir un curso con inscritos (como el del seed) e intentar eliminarlo:
   - Se muestra el error 409: *"No se puede eliminar un curso que tiene estudiantes inscritos"* (RN-06).
7. Probar con Swagger / curl:
   - `GET /api/cursos?q=node&page=1&limit=2` filtra y pagina solo los cursos publicados.
   - Intentar editar el curso de otro instructor con el token actual → 403 `FORBIDDEN` (RN-07).
