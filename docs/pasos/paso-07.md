# Paso 07 — Avance secuencial: vista de lección y completar (API + Web)

**Responsable:** Paye (asignado a Renzo en el plan) · **Rama:** `paso-07-progreso` · **Fecha:** 2026-11-12

## Qué se hizo

### Backend
- Migración `20261112000001-add-completado-inscripciones.cjs`: agrega `inscripciones.completado` (boolean, default `false`), índice compuesto `(cursoId, completado)` y backfill en SQL para inscripciones existentes que ya completaron todas las lecciones. **Aplicar con `npm run migrate` previa confirmación.**
- `middlewares/isEnrolled.js`: `isCourseEnrolled` y `isLeccionEnrolled` comparten `assertEnrolled` (404 si curso/lección no existe, 403 `NOT_ENROLLED` si el estudiante no está inscrito, RN-08).
- `repositories/progreso.repository.js` y ampliaciones de `leccion.repository.js`, `inscripcion.repository.js`, `pregunta.repository.js` y `curso.repository.js`: lecturas por lote (`IN`) sin N+1, columnas explícitas y `PREGUNTA_PUBLIC_ATTRIBUTES` sin `indiceCorrecto`.
- `services/progreso.service.js` + `controllers/progreso.controller.js`:
  - `GET /api/cursos/:id/progreso`: resumen del curso, porcentaje (`calcularPorcentaje`), `completado`, `siguienteLeccionId` y temario con `completada`, `desbloqueada` (RN-01: todas las anteriores por `orden` completadas) y `fechaCompletada`.
  - `GET /api/lecciones/:id`: valida inscripción y desbloqueo secuencial (403 `LESSON_LOCKED` si falta una lección anterior); en cuestionarios devuelve preguntas públicas mediante `toPublicPregunta()` (RN-02).
  - `POST /api/lecciones/:id/completar`: solo lecciones de contenido (422 `LESSON_NOT_CONTENT` en cuestionario), idempotente, bloquea la inscripción (`FOR UPDATE`) en transacción y actualiza `inscripciones.completado` al llegar al 100 %.
- `openapi.yaml` actualizado con el tag `Progreso`, los 3 endpoints y sus esquemas.

### Frontend
- `services/progresoService.js`, `hooks/useProgreso.js` (usa `useFetch` en paralelo para progreso y lección, actualiza el estado local sin refetch global al completar) y `utils/video.js` (embeds seguros de YouTube/Vimeo, `<video>` directo o enlace externo).
- Componentes en `components/student/`: `LessonSidebar`, `LessonVideo` y `LessonQuizPreview`.
- `pages/student/LessonViewerPage.jsx`: reemplaza `ComingSoonPage` en `AppRouter` (`/cursos/:cursoId/lecciones/:leccionId`), mobile-first, con manejo específico de `LESSON_LOCKED` y `NOT_ENROLLED` y navegación anterior/siguiente.

### Fixes de pasos anteriores
- `fix(web)`: tipado `HTMLDivElement | null` para `listboxRef` en `components/ui/Select.jsx` (resolvía el último error de `tsc --noEmit -p jsconfig.json` heredado del paso 04).
- Eliminado `ComingSoonPage.jsx` al no quedar rutas pendientes usando ese marcador.

## Decisiones
- **Desbloqueo secuencial (RN-01):** se exige que **todas** las lecciones anteriores por `orden` estén completadas (más robusto ante inserciones o reordenamientos del temario).
- **`inscripciones.completado`:** se incorpora en este paso para persistir el 100 % al completar lecciones y dejar listo el panel del paso 09.
- **Cuestionarios en paso 07:** cuando están desbloqueados muestran sus preguntas públicas y nota mínima a modo informativo hasta implementar los intentos en el paso 08.

## Cómo probar
1. Confirmar y correr `npm run migrate` en `api/`.
2. Login `estudiante1@miniaula.com` / `Password123!` → "Mis cursos" → entrar al curso:
   - La lección 1 figura completada y la lección 2 desbloqueada; la lección 3 (cuestionario) figura bloqueada con candado.
   - Intentar abrir la URL de la lección 3 (o `GET /api/lecciones/:id` por Swagger) → `403 LESSON_LOCKED` con acceso directo para volver a la lección actual.
3. En la lección 2, pulsar "Marcar como completada" → barra lateral y porcentaje se actualizan sin recargar toda la página y se desbloquea la lección 3.
4. `POST /api/lecciones/:id/completar` sobre la lección 3 (cuestionario) → `422 LESSON_NOT_CONTENT`; `GET /api/lecciones/:id` sobre la lección 3 ya desbloqueada no contiene `indiceCorrecto`.
5. `estudiante2` (no inscrito en el curso 1) intenta `GET /api/cursos/1/progreso` o `GET /api/lecciones/1` → `403 NOT_ENROLLED`.
