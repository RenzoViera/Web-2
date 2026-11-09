# Paso 05 — Lecciones y preguntas del instructor (API + Web)

**Responsable:** Renzo · **Rama:** `paso-05-lecciones` · **Fecha:** 2026-11-09

## Qué se hizo

### Backend
- Migración `20261109000001-add-video-nota-lecciones.cjs`: `lecciones.videoUrl` y `lecciones.notaMinima` (cuestionarios existentes → 70). **Aplicarla con `npm run migrate`.**
- `isLeccionOwner` / `isPreguntaOwner` (en `isCourseOwner.js`): resuelven el curso padre en una consulta y reutilizan la misma verificación de dueño.
- Lecciones: crear (orden = último + 1, bloqueo del curso), editar (tipo no editable), borrar (recompacta orden; 409 con inscritos; 422 si es la última de un curso publicado), reordenar en transacción (422 `LESSON_ORDER_MISMATCH` si no vienen todas).
- Preguntas: crear (422 `LESSON_NOT_QUIZ`), PUT completo, borrar (422 si deja vacío un cuestionario de curso publicado). 2-6 opciones sin repetir, `indiceCorrecto` en rango.
- Publicar ahora también exige que todo cuestionario tenga preguntas (422 `QUIZ_WITHOUT_QUESTIONS`).
- Topes de negocio: 50 lecciones por curso, 30 preguntas por cuestionario.
- `openapi.yaml` actualizado (tags Lecciones y Preguntas).

### Frontend
- `leccionesService`, `preguntasService`; `Modal` y `Textarea` en `components/ui/`; `components/instructor/` (`LessonList`, `LessonForm`, `QuestionList`, `QuestionForm`).
- `CourseEditorPage`: temario con subir/bajar (optimista con rollback), editar, eliminar, agregar.
- `LessonEditorPage` (`/instructor/cursos/:cursoId/lecciones/nueva` y `/:leccionId/editar`) y modal de pregunta con URL propia (`.../preguntas/nueva`, `.../preguntas/:preguntaId`).

### Fixes del paso 04
- `CourseEditorPage`: `showToast`/`setFieldValue` inexistentes (TypeError al guardar o escribir la descripción), `Alert variant="danger"` y `Button variant="outline"` inexistentes, errores de campo no mostrados.

## Cómo probar
1. `npm run migrate` (api). Login `instructor@miniaula.com` / `Password123!`.
2. Crear 3 lecciones de contenido + 1 cuestionario con 3 preguntas; reordenar y recargar → el orden persiste.
3. Publicar el curso → funciona; con un cuestionario sin preguntas → 422.
4. Otro instructor → 403 en PUT lección/pregunta. Borrar lección del curso con inscritos del seed → 409.
