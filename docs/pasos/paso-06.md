# Paso 06 — Catálogo, detalle, inscripción y Mis cursos (API + Web)

**Responsable:** Renzo (asignado a Paye en el plan) · **Rama:** `paso-06-catalogo` · **Fecha:** 2026-11-10

## Qué se hizo

### Backend
- `POST /api/cursos/:id/inscripcion` (estudiante): 404 `COURSE_NOT_FOUND` si el curso no existe o no está publicado; 409 `ALREADY_ENROLLED` si ya estaba inscrito (RN-04). No hay consulta previa: el índice UNIQUE `(usuarioId, cursoId)` rechaza el duplicado y el servicio lo traduce con `isUniqueViolation`.
- `GET /api/inscripciones/mias` (estudiante, paginado): solo las propias (RN-08, el id sale del JWT), con curso, instructor, `totalLecciones`, `leccionesCompletadas`, `porcentaje` y `siguienteLeccionId`. Todo en una consulta (subconsultas correlacionadas, sin N+1). Incluye cursos archivados (§6 del plan).
- `services/progreso.service.js` → `calcularPorcentaje(completadas, total)`: única fórmula del porcentaje (la reutilizan los pasos 07 y 09).
- `GET /api/cursos/:id` con **auth opcional** (`optionalAuthenticate`): con token de estudiante devuelve `inscrito: true/false` (EXISTS en la misma consulta); visitante o instructor → `null`. Un token inválido o vencido se atiende como visitante (la página pública no se rompe).
- `GET /api/cursos/categorias`: categorías distintas de los cursos publicados (chips del catálogo), tope 50 + `truncated`.
- `openapi.yaml`: tag Inscripciones, los 2 endpoints nuevos, `/cursos/categorias` e `inscrito` en el detalle.

### Frontend
- `CatalogPage` (`/cursos`): búsqueda por título con debounce de 300 ms (`useDebouncedCallback`), chips de categoría (sección independiente con su propia carga y error), grilla de `CourseCard` y `Pagination`. Filtros en la URL (`?q=&categoria=&page=`): se pueden compartir y el botón atrás funciona.
- `CourseDetailPage` (`/cursos/:id`): descripción, temario sin contenido (`CourseSyllabus`) y acción según quién mira: visitante → "Inicia sesión para inscribirte" (vuelve al curso tras el login), estudiante → "Inscribirme" / "Ir al curso", instructor → aviso.
- `MyCoursesPage` (`/mis-cursos`): `EnrolledCourseCard` con `ProgressBar` ("3 de 5 lecciones · 60 %") y botón Empezar / Continuar / Repasar a la siguiente lección.
- Ruta de la vista de lección (`/cursos/:cursoId/lecciones/:leccionId`) con `ComingSoonPage` hasta el paso 07.
- Componentes reutilizables: `ProgressBar`, `Pagination` (`components/ui/`), `CourseCover`, `CourseCard`, `CategoryFilter`, `CourseSyllabus` (`components/cursos/`); `utils/cursos.js` y `pluralize`.

### Fixes de pasos anteriores
- `fix(api)`: la búsqueda del catálogo no escapaba `%` y `_` (buscar "100%" devolvía todo).
- `fix(web)`: el estado vacío de los cursos del instructor no mostraba el botón (props inexistentes `actionLabel`/`onAction`).
- `fix(web)`: `PaginatedResponse<T>` no era un typedef genérico (errores de `checkJs`).

## Decisiones
- **`siguienteLeccionId`** en Mis cursos: primera lección sin completar por `orden` (o la primera si completó todas). Es a donde lleva el botón; el paso 07 decide el bloqueo en `GET /lecciones/:id`.
- **Sin `progreso.repository.js` todavía:** los conteos de avance van como subconsultas en `inscripcion.repository.js` (una sola consulta por página). El repositorio de progreso llega en el paso 07, cuando haya lecturas/escrituras propias.
- **Categorías:** `categoria` es texto libre, así que los chips salen de un endpoint (`/cursos/categorias`) en vez de una lista fija.
- Sin librerías nuevas.

## Cómo probar
1. Login `estudiante2@miniaula.com` / `Password123!` → `/cursos`: no aparecen borradores ni archivados; buscar, filtrar por categoría, paginar (`?limit` vía Swagger) y recargar mantiene los filtros.
2. Detalle → "Inscribirme" → aparece en Mis cursos con 0 % y botón "Empezar".
3. `POST /api/cursos/:id/inscripcion` de nuevo (Swagger) → 409 `ALREADY_ENROLLED`; con token de instructor → 403; curso en borrador → 404.
4. `estudiante1` ve su curso con la lección 1 completada (porcentaje > 0); `estudiante2` no ve las inscripciones de `estudiante1`.
5. Sin sesión, el detalle muestra "Inicia sesión para inscribirte" y después del login vuelve al curso.
