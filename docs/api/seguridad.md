# Seguridad e invariantes

Documento vivo (`REGLAS.md` B.13): todo cambio de roles, permisos o reglas de acceso se refleja aquí en el mismo PR.

## Autenticación

- **Contraseñas:** bcrypt con costo 10. Nunca se guardan ni se loguean en texto plano; el hash nunca sale en una respuesta.
- **Login:** 401 genérico `INVALID_CREDENTIALS`. Si el email no existe se compara igual contra un hash ficticio, así la demora no revela qué emails están registrados. Rate limit: 5 intentos fallidos por minuto e IP → 429.
- **JWT:** HS256 con payload `{ id, rol }`, firmado con `JWT_SECRET` (≥ 32 caracteres, validado al arrancar) y con expiración `JWT_EXPIRES_IN` (2 h). Al verificar se fija el algoritmo (evita la confusión de algoritmos) y se valida la forma del payload.
- **Stateless:** no hay revocación. Cerrar sesión = el cliente borra el token. Un cambio de contraseña no invalida los tokens ya emitidos: vencen solos (2 h).
- **Token en el cliente:** `localStorage` (decisión del plan). Ante un XSS sería legible; se mitiga con React (escapa por defecto, sin `dangerouslySetInnerHTML`), expiración corta y CORS limitado a `CORS_ORIGIN`.

## Autorización

| Middleware | Responde | Uso |
|---|---|---|
| `authenticate` | 401 `UNAUTHORIZED` (sin token) · `INVALID_TOKEN` · `TOKEN_EXPIRED` | Toda ruta privada |
| `optionalAuthenticate` | Nunca 401: token inválido o vencido → visitante | Rutas públicas que cambian según quién mira (`GET /cursos/:id` → `inscrito`) |
| `authorize(...roles)` | 403 `FORBIDDEN` | Rutas de un rol (instructor / estudiante) |
| `isCourseOwner` | 404 `COURSE_NOT_FOUND` · 403 `FORBIDDEN` | Recursos del instructor dueño (RN-07) |
| `isLeccionOwner` / `isPreguntaOwner` | 404 `LESSON_NOT_FOUND` / `QUESTION_NOT_FOUND` · 403 `FORBIDDEN` | Lecciones y preguntas: resuelven el curso padre en una consulta y usan la misma verificación de dueño |
| `isCourseEnrolled` / `isLeccionEnrolled` | 404 `COURSE_NOT_FOUND` / `LESSON_NOT_FOUND` · 403 `NOT_ENROLLED` | Avance y contenido de lecciones: exigen inscripción del estudiante autenticado (RN-08) |

## Matriz de acceso implementada

| Endpoint | Público | Estudiante | Instructor |
|---|---|---|---|
| `POST /auth/register` | ✅ | — | — |
| `POST /auth/login` | ✅ (rate limit) | — | — |
| `GET /users/me` | 401 | ✅ el propio | ✅ el propio |
| `PUT /users/me` | 401 | ✅ el propio | ✅ el propio |
| `GET /cursos` | ✅ solo publicados | ✅ solo publicados | ✅ solo publicados |
| `GET /cursos/categorias` | ✅ | ✅ | ✅ |
| `GET /cursos/:id` | ✅ solo si publicado (`inscrito: null`) | ✅ solo si publicado (+ `inscrito`) | ✅ solo si publicado (`inscrito: null`) |
| `POST /cursos/:id/inscripcion` | 401 | ✅ solo publicados (409 si ya inscrito) | 403 |
| `GET /inscripciones/mias` | 401 | ✅ solo las propias | 403 |
| `GET /cursos/:id/progreso` | 401 | ✅ solo si está inscrito (`403 NOT_ENROLLED`) | 403 |
| `GET /lecciones/:id` | 401 | ✅ solo si está inscrito y desbloqueada (`403 LESSON_LOCKED`) | 403 |
| `POST /lecciones/:id/completar` | 401 | ✅ solo contenido desbloqueado (`422` si cuestionario) | 403 |
| `POST /cursos` | 401 | 403 | ✅ crea borrador |
| `PUT /cursos/:id` | 401 | 403 | ✅ solo dueño (403 ajeno) |
| `DELETE /cursos/:id` | 401 | 403 | ✅ solo dueño (409 con inscritos) |
| `PATCH /cursos/:id/estado` | 401 | 403 | ✅ solo dueño (422 sin lecciones) |
| `GET /instructor/cursos` | 401 | 403 | ✅ solo los propios |
| `GET /instructor/cursos/:id` | 401 | 403 | ✅ solo dueño (con preguntas) |
| `POST /cursos/:id/lecciones` | 401 | 403 | ✅ solo dueño |
| `PATCH /cursos/:id/lecciones/orden` | 401 | 403 | ✅ solo dueño (422 si no vienen todas) |
| `PUT /lecciones/:id` | 401 | 403 | ✅ solo dueño (tipo no editable) |
| `DELETE /lecciones/:id` | 401 | 403 | ✅ solo dueño (409 con inscritos) |
| `POST /lecciones/:id/preguntas` | 401 | 403 | ✅ solo dueño (422 si no es cuestionario) |
| `PUT /preguntas/:id` · `DELETE /preguntas/:id` | 401 | 403 | ✅ solo dueño |

El resto de los endpoints y su acceso previsto están en [endpoints.md](endpoints.md); cada paso los agrega aquí al implementarlos.

## Invariantes

1. `passwordHash` nunca sale: los repositorios piden columnas explícitas, las respuestas pasan por `toPublicUsuario()` (lista blanca) y el `defaultScope` de `Usuario` queda como red de seguridad.
2. `indiceCorrecto` nunca llega al estudiante (RN-02): `toPublicPregunta()`; solo el editor del instructor dueño lo ve.
3. El rol se elige al registrarse y no se puede editar (`PUT /users/me` lo ignora). El rol de `req.user` sale del JWT firmado.
4. Cada usuario lee y edita solo su perfil: `/users/me` usa `req.user.id`, nunca un id enviado por el cliente.
5. Cambiar la contraseña exige la actual (`passwordActual`).
6. El frontend oculta pantallas por rol (`RoleRoute`) solo por experiencia de uso: la autorización real la hace la API.
7. Errores sin stack ni SQL en la respuesta; los 5xx se loguean con `requestId`, usuario y stack. Nunca se loguean contraseñas, hashes ni tokens.
8. Toda entrada se valida con Zod antes de llegar al servicio; los campos escribibles de cada modelo están acotados en su repositorio (`fields`).
9. Un curso nace siempre en estado `borrador`. Solo el instructor dueño puede modificarlo, publicarlo, archivarlo o eliminarlo (RN-07).
10. Un curso solo puede publicarse si cuenta con al menos una lección (`RN-05` / 422 `COURSE_CANNOT_PUBLISH_EMPTY`).
11. Un curso con estudiantes inscritos no puede ser eliminado (`RN-06` / 409 `COURSE_HAS_STUDENTS`).
12. El catálogo y detalle público solo devuelven cursos con `estado = 'publicado'`; el temario público omite contenido, videoUrl y preguntas.
13. Un curso publicado siempre tiene ≥ 1 lección y todos sus cuestionarios ≥ 1 pregunta: se valida al publicar (422 `QUIZ_WITHOUT_QUESTIONS`) y al borrar (422 `PUBLISHED_COURSE_NEEDS_LESSON` / `QUIZ_WITHOUT_QUESTIONS`).
14. No se borran lecciones de un curso con inscritos (409 `COURSE_HAS_STUDENTS`): rompería su progreso (§6 del plan).
15. El `orden` de las lecciones es siempre 1..n: crear, borrar y reordenar bloquean la fila del curso (`SELECT ... FOR UPDATE`) dentro de una transacción.
16. Un estudiante se inscribe una sola vez por curso (RN-04): índice UNIQUE `(usuarioId, cursoId)` → 409 `ALREADY_ENROLLED`. Solo se aceptan inscripciones a cursos publicados (404 en borrador o archivado).
17. Cada estudiante ve solo sus inscripciones (RN-08): `GET /inscripciones/mias` filtra por `req.user.id`, nunca por un id del cliente. El detalle público calcula `inscrito` con el id del token.
18. Un curso archivado sigue visible en Mis cursos para quien ya estaba inscrito (§6 del plan); no aparece en el catálogo ni acepta inscripciones nuevas.
19. Inscribirse y borrar una lección no se pisan: el INSERT de la inscripción toma `FOR KEY SHARE` sobre el curso (FK), que espera al `FOR UPDATE` del borrado; así el conteo de inscritos del borrado es fiel (invariante 14).
20. El avance es estrictamente secuencial (RN-01): una lección está desbloqueada solo si todas las lecciones anteriores por `orden` están completadas en `progresos_lecciones`; tanto `GET /lecciones/:id` como `POST /lecciones/:id/completar` devuelven 403 `LESSON_LOCKED` si falta alguna anterior.
21. Los cuestionarios no pueden marcarse como completados manualmente (`422 LESSON_NOT_CONTENT`): solo se completan al aprobarlos (paso 08). Al ver un cuestionario desbloqueado, `GET /lecciones/:id` devuelve preguntas mediante `PREGUNTA_PUBLIC_ATTRIBUTES` + `toPublicPregunta()` (sin `indiceCorrecto`, RN-02).
22. Completar una lección toma bloqueo `FOR UPDATE` sobre la inscripción del estudiante y actualiza `inscripciones.completado` en la misma transacción.
