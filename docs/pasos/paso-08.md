# Paso 08 — Cuestionarios del estudiante (API + Web)

**Responsable:** Renzo (asignado a Paye en el plan; los pasos 06 y 07 se intercambiaron) · **Rama:** `paso-08-cuestionarios` · **Fecha:** 2026-11-14

## Qué se hizo

### Backend
- `POST /api/lecciones/:id/intentos` (estudiante inscrito) → 201. Rutas → `validate(intentoSchema)` → `cuestionario.controller.js` → `cuestionario.service.js`:
  - 422 `LESSON_NOT_QUIZ` si la lección no es un cuestionario; 403 `NOT_ENROLLED` / `LESSON_LOCKED` como en el paso 07.
  - **403 `ATTEMPTS_EXHAUSTED`** si ya hay 3 intentos (RN-03, `MAX_INTENTOS_CUESTIONARIO`).
  - Calificación **en el servidor** (RN-02): `nota = round(aciertos / total * 100)`, `aprobado = nota >= notaMinima`. 422 `INVALID_QUIZ_ANSWERS` (con `details`) si falta responder una pregunta, sobra una ajena o la opción no existe.
  - Guarda el intento en `intentos_cuestionarios` y, si la **mejor nota** alcanza la mínima, marca el cuestionario como completado (RN-01), lo que desbloquea la siguiente lección. Si con eso se completa el curso, `inscripciones.completado = true`. Un intento peor no descompleta un cuestionario ya aprobado.
  - Todo en una transacción que bloquea la inscripción (`FOR UPDATE`): dos envíos simultáneos no pueden registrar un 4.º intento.
  - Respuesta: `nota`, `aprobado`, `aciertos`, `totalPreguntas`, `notaMinima`, `completada`, `fechaCompletada`, `intentos: { realizados, maximo, restantes, mejorNota }` y el resumen del curso (`cursoCompletado`, `porcentaje`, `siguienteLeccionId`…). **Nunca** cuáles eran las correctas.
- `GET /api/lecciones/:id`: en cuestionarios agrega `intentos` (mismo objeto). Preguntas e intentos se piden en paralelo. En lecciones de contenido `intentos` es `null`.
- `services/progreso.service.js`: completar y rendir comparten `bloquearAvance` (bloqueo + temario + progresos + RN-01), `marcarCompletadaEnAvance` y `resumirAvance`. `completarLeccion` usa las mismas piezas y su respuesta no cambia.
- Nuevos: `validators/intento.validator.js`, `repositories/intento.repository.js` (`COUNT` + `MAX(puntaje)` en una consulta), `services/cuestionario.service.js`, `controllers/cuestionario.controller.js`, `pregunta.repository.findClavesByLeccion` y los códigos `ATTEMPTS_EXHAUSTED` e `INVALID_QUIZ_ANSWERS`.
- `openapi.yaml`: tag `Cuestionarios`, el endpoint nuevo con ejemplos de 403/422, schemas `IntentoRequest`, `RespuestaIntento`, `ResumenIntentos`, `IntentoResultado` e `intentos` en `LeccionEstudiante`.

### Frontend
- `services/intentosService.js` (`rendir`) y `useProgreso.rendirCuestionario(respuestas)`. Hace 1 request y con su respuesta actualiza los intentos de la lección y, si quedó aprobado, el temario (desbloqueo y porcentaje), sin refetch (REGLAS C.14).
- `components/student/LessonQuiz.jsx` dentro de `LessonViewerPage`, en lugar de la vista previa del paso 07. Elige entre:
  - `QuizForm.jsx`: "Intento X de 3 · N preguntas · Nota mínima: 70", radios por pregunta y Enviar. Usa `useAppForm`, todas las preguntas son obligatorias y los errores de la API van a `formError`.
  - `QuizResult.jsx`: `80 / 100`, badge Aprobado/Reprobado, aciertos, mejor nota, intentos restantes, y Siguiente lección / Reintentar / Volver a rendir.
  - El resumen de un cuestionario ya aprobado (Volver a rendir mientras queden intentos y la nota no sea 100).
  - El aviso de intentos agotados sin aprobar.
- `RadioCardGroup` con `variant="list"` (una opción por fila, enunciado destacado) en vez de radios nuevos. `utils/cuestionarios.js` (`NOTA_MAXIMA`, `puedeMejorarNota`, `intentosRestantesLabel`).
- Eliminado `LessonQuizPreview.jsx` (era el placeholder hasta este paso).

## Decisiones
- **§6 del plan:** sin respuesta del docente → propuestas: 4.º intento = **403 `ATTEMPTS_EXHAUSTED`** y se puede volver a rendir un cuestionario aprobado mientras queden intentos (se conserva la mejor nota).
- **Sin migración:** se usa la tabla `intentos_cuestionarios` del paso 02 (intentos = `COUNT`, mejor nota = `MAX(puntaje)`). El máximo de 3 lo garantiza el bloqueo de la inscripción en la transacción.
- **Distinto del plan:** el plan listaba `intentos`, `mejorNota` e `intentosRestantes` sueltos. Van agrupados en `intentos: { realizados, maximo, restantes, mejorNota }`, igual en `GET /lecciones/:id` y en la respuesta del POST, así el front parchea la lección con el mismo objeto. El POST responde **201** (crea un intento) y agrega `aciertos` (no revela cuáles: con el total ya se deduce de la nota).
- `completada = mejor nota ≥ notaMinima`. Si el instructor cambia la nota mínima, vale para los intentos siguientes; un cuestionario ya aprobado sigue completado.
- Sin librerías nuevas.

## Verificado
- `npm run lint` en `api/` y `web/`, `tsc --noEmit -p jsconfig.json` en `web/` y `npm run build`: sin errores.
- La app de la API carga completa (rutas, servicios, modelos) y `openapi.yaml` no tiene referencias rotas.
- Funciones puras: `calcularNota` (1/2 → 50, 2/3 → 67), `resumirIntentos` e `intentoSchema` (rechaza lista vacía, preguntas repetidas e índice fuera de rango).
- **Falta** el "Cómo probar" con la base de datos (esta máquina no tiene Docker).

## Cómo probar
1. `docker compose up --build` (no hay migraciones nuevas).
2. Login `estudiante1@miniaula.com` / `Password123!` → Mis cursos → completar la lección 2 → abrir la 3 (cuestionario de 2 preguntas, nota mínima 70).
3. Responder 1 bien y 1 mal → `50 / 100`, Reprobado, "Intentos restantes: 2 de 3"; la lección siguiente sigue bloqueada (en este seed no hay siguiente: el curso queda en 67 %).
4. Reintentar con las 2 bien → `100 / 100`, Aprobado; el temario marca el cuestionario como completado y el curso llega a 100 % sin recargar.
5. Con 100 la vista ya no ofrece volver a rendir (no hay nota que mejorar), así que por Swagger: 3.er `POST /api/lecciones/:id/intentos` con las 2 mal → `nota: 0`, `mejorNota: 100`, `completada: true`. El 4.º → 403 `ATTEMPTS_EXHAUSTED`.
6. DevTools → Network: ni `GET /lecciones/:id` ni la respuesta del POST contienen `indiceCorrecto` ni cuáles eran las correctas.
7. Swagger: body sin una de las preguntas → 422 `INVALID_QUIZ_ANSWERS`; `POST` sobre una lección de contenido → 422 `LESSON_NOT_QUIZ`; con `estudiante2` (no inscrito) → 403 `NOT_ENROLLED`.
