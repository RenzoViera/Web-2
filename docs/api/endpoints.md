# Endpoints de la API

Prefijo: `/api`. Estado: ✅ implementado · ⏳ pendiente (se indica el paso responsable).
Al implementar un endpoint: cambiar su estado aquí y documentarlo en `api/docs/openapi.yaml`.

## Sistema

| Método | Ruta | Acceso | Descripción | Estado |
|---|---|---|---|---|
| GET | `/health` | Público | Estado de la API y de la BD (200 `ok` / 503 `degraded`) | ✅ Paso 01 |
| GET | `/docs` | Público | Swagger UI | ✅ Paso 01 |
| GET | `/docs/openapi.json` | Público | Especificación OpenAPI en JSON | ✅ Paso 01 |

## Autenticación y perfil

| Método | Ruta | Acceso | Descripción | Estado |
|---|---|---|---|---|
| POST | `/auth/register` | Público | Registro con rol → 201 `{ user, token }`, 409 `EMAIL_TAKEN` | ✅ Paso 03 |
| POST | `/auth/login` | Público (5 fallidos/min por IP) | Login → 200 `{ user, token }`, 401 `INVALID_CREDENTIALS` genérico, 429 | ✅ Paso 03 |
| GET | `/users/me` | Autenticado | Perfil propio (401 si el usuario ya no existe) | ✅ Paso 03 |
| PUT | `/users/me` | Autenticado | Editar nombre, email y/o password (al menos uno; password exige `passwordActual`; rol no editable) → usuario actualizado | ✅ Paso 03 |

Cerrar sesión: stateless, el cliente borra el token (no hay endpoint).

## Cursos

| Método | Ruta | Acceso | Descripción | Estado |
|---|---|---|---|---|
| GET | `/cursos` | Público | Catálogo publicado con `q`, `categoria`, `page`, `limit` | ⏳ Paso 04 |
| GET | `/cursos/:id` | Público (auth opcional) | Detalle + temario sin contenido (+ `inscrito` en paso 06) | ⏳ Paso 04 / 06 |
| POST | `/cursos` | Instructor | Crear curso (siempre `borrador`) | ⏳ Paso 04 |
| PUT | `/cursos/:id` | Instructor dueño | Editar curso | ⏳ Paso 04 |
| DELETE | `/cursos/:id` | Instructor dueño | Eliminar (409 con inscritos) | ⏳ Paso 04 |
| PATCH | `/cursos/:id/estado` | Instructor dueño | Publicar/archivar (422 sin lecciones) | ⏳ Paso 04 |
| GET | `/instructor/cursos` | Instructor | Mis cursos con conteos | ⏳ Paso 04 |
| GET | `/instructor/cursos/:id` | Instructor dueño | Curso para el editor (con `indiceCorrecto`) | ⏳ Paso 04 |
| GET | `/instructor/cursos/:id/resumen` | Instructor dueño | Panel de métricas | ⏳ Paso 09 |

## Lecciones y preguntas

| Método | Ruta | Acceso | Descripción | Estado |
|---|---|---|---|---|
| POST | `/cursos/:id/lecciones` | Instructor dueño | Crear lección (orden = último + 1) | ⏳ Paso 05 |
| PATCH | `/cursos/:id/lecciones/orden` | Instructor dueño | Reordenar en transacción | ⏳ Paso 05 |
| PUT | `/lecciones/:id` | Instructor dueño | Editar lección | ⏳ Paso 05 |
| DELETE | `/lecciones/:id` | Instructor dueño | Borrar y recompactar orden (409 con inscritos) | ⏳ Paso 05 |
| POST | `/lecciones/:id/preguntas` | Instructor dueño | Crear pregunta (422 si no es cuestionario) | ⏳ Paso 05 |
| PUT | `/preguntas/:id` | Instructor dueño | Editar pregunta | ⏳ Paso 05 |
| DELETE | `/preguntas/:id` | Instructor dueño | Borrar pregunta | ⏳ Paso 05 |

## Inscripción y avance

| Método | Ruta | Acceso | Descripción | Estado |
|---|---|---|---|---|
| POST | `/cursos/:id/inscripcion` | Estudiante | Inscribirse (409 duplicada) | ⏳ Paso 06 |
| GET | `/inscripciones/mias` | Estudiante | Mis cursos con porcentaje | ⏳ Paso 06 |
| GET | `/cursos/:id/progreso` | Estudiante inscrito | Estado de cada lección | ⏳ Paso 07 |
| GET | `/lecciones/:id` | Estudiante inscrito | Contenido (403 `LESSON_LOCKED` si bloqueada) | ⏳ Paso 07 |
| POST | `/lecciones/:id/completar` | Estudiante inscrito | Marcar lección de contenido como completada | ⏳ Paso 07 |
| POST | `/lecciones/:id/intentos` | Estudiante inscrito | Rendir cuestionario (403 `ATTEMPTS_EXHAUSTED`) | ⏳ Paso 08 |
