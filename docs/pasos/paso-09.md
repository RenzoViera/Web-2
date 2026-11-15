# Paso 09 — Panel del instructor + Swagger completo (API + Web)

**Responsable:** Renzo · **Rama:** `paso-09-panel` · **Fecha:** 2026-11-15

## Qué se hizo

### Backend (`api/`)
- Módulo de métricas y resumen del instructor (`instructor.repository.js`, `instructor.service.js`, `instructor.controller.js`, `instructor.routes.js` montado en `/api/instructor`):
  - `GET /api/instructor/resumen`: totales acumulados del panel para el instructor autenticado: conteo total de cursos desglosado por estado (`publicados`, `borradores`, `archivados`), total de lecciones, total de estudiantes matriculados, total de finalizaciones de curso (`inscripciones.completado = true`) y tasa promedio de completitud general.
  - `GET /api/instructor/cursos/:id/resumen`: requiere `authenticate`, `authorize('instructor')` y `isCourseOwner` (RN-07). Devuelve la información del curso, métricas agregadas del curso (`totalInscritos`, `totalCompletados`, `tasaCompletitud`, `promedioProgreso` calculado de forma exacta con la suma de progresos completados en la BD y `totalLecciones`), y el desglose de avance por lección (conteo y tasa de estudiantes que la completaron; en cuestionarios incluye `totalIntentos`, `promedioPuntaje`, `totalEstudiantes` y `aprobados`).
  - `GET /api/instructor/cursos/:id/estudiantes`: listado paginado (`page`, `limit` default 10 máx 50) de estudiantes inscritos en el curso, con término de búsqueda opcional `q` (búsqueda por nombre o email) y filtro opcional por estado `completado` (`true`/`false`). Incluye subconsulta SQL correlacionada de lecciones completadas y porcentaje de avance (`calcularPorcentaje`).
- Validadores en `validators/instructor.validator.js` (`cursoEstudiantesQuerySchema`).
- Seeder complementario `20261115000001-seed-panel.cjs` con un segundo instructor, un tercer estudiante, un nuevo curso publicado con lecciones, inscripciones, progresos y calificaciones de cuestionarios para poblar el panel con datos realistas.
- **Swagger / OpenAPI completo:** actualización integral de `api/docs/openapi.yaml`, alcanzando 100 % de cobertura de los endpoints del proyecto (23 rutas y 51 esquemas validados sin referencias rotas).

### Frontend (`web/`)
- `services/instructorService.js`: cliente para `getResumenGlobal`, `getCursoResumen` y `getCursoEstudiantes` con contratos JSDoc completos.
- `routes/paths.js`: incorporación de `instructorCursoResumen` (`/instructor/cursos/:id/resumen`) y la función auxiliar `instructorCursoResumenPath(id)`.
- `routes/AppRouter.jsx`: ruta protegida bajo `RoleRoute` de instructor para `CourseMetricsPage` (carga lazy).
- `pages/instructor/InstructorCoursesPage.jsx`:
  - Tarjetas de resumen global en la parte superior (`useFetch` independiente, REGLAS C.27): Total cursos (publicados / borradores), Total inscritos, Cursos completados y Tasa promedio de finalización.
  - Cada tarjeta de curso incorpora el botón de acceso directo a **Métricas** junto al botón de **Editar**.
- Nueva página `pages/instructor/CourseMetricsPage.jsx`:
  - Enlace de retorno al panel general y cabecera con portada del curso, estado, categoría, nivel y acceso al editor.
  - KPI Cards principales: Inscritos, Completados, Tasa de finalización (%) y Avance promedio con `ProgressBar`.
  - **Embudo de avance por lección**: barras de progreso visuales con Tailwind v4 mostrando la tasa de completitud por lección (`X de Y estudiantes completaron`). En cuestionarios, tarjeta de métricas con nota mínima, intentos totales, promedio de notas y tasa de aprobados.
  - **Listado de estudiantes inscritos**: buscador con debounce (`useDebouncedCallback`), filtros rápidos (Todos, Completados, En progreso), tabla semántica en escritorio y vista de tarjetas en móvil (`REGLAS.md` C.25), con avatar de iniciales, fecha formateada, barra de progreso individual y paginación con `Pagination`.
- Íconos SVG propios adicionales en `components/icons/index.jsx`: `BarChartIcon`, `TrendingUpIcon`, `AwardIcon`.

## Decisiones
- **Agregaciones en base de datos (REGLAS B.25 / C.32):** los promedios y conteos se calculan directamente en PostgreSQL con `COUNT`, `AVG` y subconsultas correlacionadas, evitando traer registros crudos a memoria para sumarlos en el cliente.
- **Ruta de métricas por curso (`/instructor/cursos/:id/resumen`):** permite que el instructor tenga una URL dedicada y compartible para monitorear cada curso individualmente.
- **Paginación independiente para alumnos:** los filtros y la paginación de los estudiantes matriculados son una petición remota separada que no fuerza el refetch de las métricas generales ni del embudo de lecciones (REGLAS C.14).
- **Swagger al 100 %:** todos los endpoints cuentan con sus esquemas de request, query, params, respuestas de éxito y respuestas de error estandarizadas.

## Verificado
- `npm run lint` en `api/` (ESLint): 0 errores, 0 warnings.
- `npm run lint` en `web/` (Oxlint): 0 errores, 0 warnings.
- `npm run build` en `web/` (Vite build): bundle generado limpiamente en ~380 ms.
- Validación de OpenAPI (`openapi.yaml`): 23 rutas y 51 esquemas analizados; 0 referencias rotas.
- Carga de la aplicación Express (`api/src/app.js`): arranca con todas las rutas y middlewares montados sin errores.

## Cómo probar
1. Iniciar sesión como instructor (`instructor@miniaula.com` / `Password123!`).
2. En la barra de navegación hacer clic en **Panel** (`/instructor/cursos`):
   - Verificar las tarjetas superiores de resumen general (Cursos, Inscritos, Completados, Tasa de finalización).
   - Verificar que en las tarjetas de cursos aparece el botón **Métricas** junto a **Editar**.
3. Hacer clic en **Métricas** de un curso:
   - Se abre `/instructor/cursos/:id/resumen`.
   - Verificar las KPI Cards superiores (Inscritos, Completados, Tasa de finalización, Avance promedio).
   - Revisar la sección **Avance por lección** (embudo de completitud con barras de progreso y estadísticas de cuestionario).
   - Revisar la sección **Estudiantes inscritos** con su buscador, filtros de estado (Todos, Completados, En progreso) y paginación.
4. En Swagger (`/api/docs`):
   - Verificar la documentación y probar los endpoints `/api/instructor/resumen`, `/api/instructor/cursos/{id}/resumen` y `/api/instructor/cursos/{id}/estudiantes`.
