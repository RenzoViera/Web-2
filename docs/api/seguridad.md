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
| `authorize(...roles)` | 403 `FORBIDDEN` | Rutas de un rol (instructor / estudiante) |
| `isCourseOwner` (paso 04) | 404 / 403 | Recursos del instructor dueño (RN-07) |
| `isEnrolled` (paso 07) | 403 | Contenido de un curso para inscritos (RN-08) |

## Matriz de acceso implementada

| Endpoint | Público | Estudiante | Instructor |
|---|---|---|---|
| `POST /auth/register` | ✅ | — | — |
| `POST /auth/login` | ✅ (rate limit) | — | — |
| `GET /users/me` | 401 | ✅ el propio | ✅ el propio |
| `PUT /users/me` | 401 | ✅ el propio | ✅ el propio |

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
