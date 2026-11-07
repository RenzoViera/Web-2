# Backend (`api/`)

## Arranque (`src/server.js`)

1. `config/env.js` valida las variables de entorno con Zod. Si falta alguna o es inválida, el proceso termina mostrando la lista de errores (no arranca a medias).
2. `sequelize.authenticate()` verifica la conexión a PostgreSQL antes de escuchar.
3. `createApp().listen(API_PORT)`.
4. Apagado ordenado con `SIGTERM`/`SIGINT`: deja de aceptar conexiones, cierra el pool de la BD y sale (timeout de 10 s). En Docker, `init: true` y `CMD ["node", ...]` hacen que la señal llegue al proceso.
5. `unhandledRejection` se registra y termina el proceso (Docker lo reinicia con `restart: unless-stopped`).

## Configuración

| Archivo | Rol |
|---|---|
| `src/config/env.js` | Única fuente de variables. Exporta `env` congelado: `port`, `db`, `jwt`, `corsOrigins`, `isProduction`... Lee `api/.env` o el `.env` de la raíz (en Docker llegan por `env_file`). |
| `src/config/database.js` | Instancia única de Sequelize (pool 10, sin logging de SQL). |
| `src/config/zod.js` | `z.config(z.locales.es())`: todos los mensajes de validación en español. |
| `db/config.cjs` + `.sequelizerc` | Config de sequelize-cli (CommonJS porque el CLI usa `require`). `seederStorage: 'sequelize'` → cada seeder corre una sola vez (tabla `SequelizeData`). |

Regla: nunca usar `process.env` fuera de `config/`.

## Pipeline de una request (`src/app.js`)

```
requestId → helmet → cors → express.json(100kb) → morgan → /api routes → notFound → errorHandler
```

- **requestId**: genera un UUID (o reutiliza un `X-Request-Id` válido del cliente), lo deja en `req.id` y lo devuelve en el header `X-Request-Id`. Aparece en cada línea de morgan y en los logs de errores 500, así un error reportado por el usuario se ubica en los logs.
- **helmet**: headers de seguridad; se desactiva `upgrade-insecure-requests` porque la API se sirve por HTTP en Docker (si no, Swagger UI no carga sus assets).
- **cors**: solo los orígenes de `CORS_ORIGIN` (lista separada por comas); expone `X-Request-Id` al frontend.
- **morgan**: `:id :method :url :status :res[content-length] - :response-time ms user=:user` (`user` = id del usuario autenticado o `-`).

## Errores

Formato único en todas las respuestas de error (`REGLAS.md` B.4):

```json
{
  "error": {
    "status": 422,
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos",
    "details": [{ "location": "body", "field": "email", "message": "Ingresa un email válido" }],
    "requestId": "3f1c2a9e-5b7d-4c1e-9a2f-8d6b4e0c1a7f",
    "timestamp": "2026-11-07T12:00:00.000Z"
  }
}
```

- `requestId` es el mismo valor del header `X-Request-Id`: el usuario lo copia del aviso de error del front y con él se encuentra la línea en los logs.
- 4xx: `message` legible para el usuario final (el front lo muestra tal cual). 5xx: mensaje genérico `Error interno del servidor`, sin SQL ni stack; se loguea `[requestId] MÉTODO url 500 user=<id>` + stack (solo el stack: el objeto de un error SQL trae los valores de la consulta).
- Se lanzan con `throw new AppError(status, ERROR_CODES.X, mensaje, details)`. Express 5 captura errores de funciones `async`, no hace falta `try/catch` ni `asyncHandler`.
- `utils/errorCodes.js` centraliza los códigos; cada paso agrega los suyos (`LESSON_LOCKED`, `ATTEMPTS_EXHAUSTED`...).
- Los errores esperables de la BD (email duplicado, FK) se traducen a 4xx **en el servicio** con `utils/dbErrors.js` (`isUniqueViolation(error, campo)`), con un código y mensaje específicos.
- `middlewares/errorHandler.js` es el único manejador y la red de seguridad para lo que no se tradujo antes:

| Error | HTTP | code |
|---|---|---|
| `AppError` | el suyo | el suyo |
| `ZodError` (validación fuera del middleware) | 422 | `VALIDATION_ERROR` |
| Sequelize `UniqueConstraintError` | 409 | `CONFLICT` |
| Sequelize `ForeignKeyConstraintError` | 409 | `CONFLICT` |
| Sequelize `ValidationError` | 422 | `VALIDATION_ERROR` |
| JSON mal formado (`entity.parse.failed`) | 400 | `INVALID_JSON` |
| Body > 100 kb | 413 | `PAYLOAD_TOO_LARGE` |
| Cualquier otro | 500 | `INTERNAL_ERROR` (se loguea con stack; la respuesta nunca incluye el stack) |

- `middlewares/notFound.js`: 404 `ROUTE_NOT_FOUND` con método y ruta.

## Validación (`middlewares/validate.js`)

```js
router.get('/:id', validate({ params: idParamSchema, query: paginationQuerySchema }), controller.get);
router.post('/', validate({ body: crearCursoSchema }), controller.create);
```

- Valida `params`, `query` y `body` y **reemplaza** cada uno por el valor parseado (tipos convertidos, defaults aplicados). En Express 5 `req.query` es un getter, por eso se redefine con `Object.defineProperty`.
- Junta los errores de todas las fuentes en `details` (`location`, `field`, `message`).
- Solo body inválido → **422** `VALIDATION_ERROR`; params/query inválidos → **400** `BAD_REQUEST` (según §2.2 del plan).
- Esquemas reutilizables en `validators/common.validator.js`: `idSchema`, `idParamSchema`, `paginationQuerySchema` (`page` ≥ 1 default 1, `limit` 1-50 default 9).

## Autenticación y autorización (paso 03)

| Pieza | Dónde | Qué hace |
|---|---|---|
| Contraseñas | `services/auth.service.js` → `hashPassword`, `verifyPassword` | bcrypt costo 10. Si el email no existe, el login compara igual contra un hash ficticio: tarda lo mismo y no revela qué emails existen. |
| Token | `services/auth.service.js` → `signToken`, `verifyToken` | JWT HS256 con `{ id, rol }` que expira según `JWT_EXPIRES_IN`. `verifyToken` fija el algoritmo, distingue expirado (`TOKEN_EXPIRED`) de inválido (`INVALID_TOKEN`) y valida la forma del payload con Zod. |
| `authenticate` | `middlewares/authenticate.js` | `Authorization: Bearer <token>` → `req.user = { id, rol }`. No consulta la BD: el rol no es editable y el token firmado ya lo trae (0 consultas extra por request). Sin header → 401 `UNAUTHORIZED`. |
| `authorize(...roles)` | `middlewares/authorize.js` | Después de `authenticate`; 403 `FORBIDDEN` si el rol no coincide. |
| `loginRateLimit` | `middlewares/rateLimit.js` | 5 intentos **fallidos** por minuto e IP (los exitosos no cuentan) → 429 `TOO_MANY_REQUESTS` con `Retry-After`. |

```js
cursoRoutes.post('/', authenticate, authorize(ROLES.INSTRUCTOR), validate({ body: crearCursoSchema }), cursoController.create);
```

- Cerrar sesión es stateless: el cliente borra el token (no hay endpoint).
- Roles en `utils/roles.js` (`ROLES.ESTUDIANTE`, `ROLES.INSTRUCTOR`); los validadores usan `ROLE_VALUES`.
- Invariantes y matriz de acceso: [seguridad.md](seguridad.md).

## Repositorios

- Son los únicos que importan modelos. Piden columnas explícitas (`attributes`; `returning` en create/update) y acotan los campos escribibles con `fields` (`REGLAS.md` B.20): con `attributes` explícito el `exclude` del `defaultScope` no aplica, así que el repositorio decide qué columnas salen.
- Los servicios los importan como namespace: `import * as usuarioRepository from '../repositories/usuario.repository.js'`.
- `usuario.repository.js`: `findById`, `findByEmailWithPassword` (solo login), `findPasswordHash`, `create` (INSERT ... RETURNING) y `update` (UPDATE ... RETURNING, `null` si el usuario no existe).

## Sanitizadores (`utils/sanitizers.js`)

`toPublicUsuario(usuario)` → `{ id, nombre, email, rol, createdAt }` (lista blanca). Toda respuesta con usuarios pasa por él; `passwordHash` nunca sale.

## Paginación (`utils/pagination.js`)

```js
const { page, limit, offset } = getPagination(req.query);
const { rows, count } = await Curso.findAndCountAll({ limit, offset });
return buildPaginatedResponse(rows, count, { page, limit });
// → { data: [...], meta: { page, limit, total, totalPages } }
```

`getPagination` también es defensivo (normaliza valores inválidos y aplica el máximo 50) por si se usa sin `validate`.

## Health (`GET /api/health`)

Capas mínimas: `routes/health.routes.js` → `controllers/health.controller.js` → `services/health.service.js`. El módulo de referencia con todas las capas (validador, repositorio, servicio, controlador, rutas) es auth/usuarios del paso 03 (`REGLAS.md` B.12). El servicio prueba la BD con `authenticate()` (timeout 3 s): 200 `{ status: "ok", database: "up" }` o 503 `{ status: "degraded", database: "down" }`. Docker Compose lo usa como healthcheck del contenedor `api`.

## Swagger (`/api/docs`)

- `api/docs/openapi.yaml` se parsea al arrancar y se sirve con swagger-ui-express; también en JSON en `/api/docs/openapi.json`.
- Ya incluye componentes reutilizables: `bearerAuth`, schemas `Error`, `ErrorDetail`, `PaginationMeta`, parámetros `IdParam`, `PageQuery`, `LimitQuery` y respuestas `BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`, `UnprocessableEntity`, `InternalError`. Cada paso solo agrega sus `paths` referenciándolos con `$ref`.

## Logs (`utils/logger.js`)

`logger.info/warn/error(mensaje, meta?)` con timestamp ISO. ESLint prohíbe `console.*` fuera de este archivo. Nunca se loguean contraseñas, hashes, tokens ni bodies de auth (`REGLAS.md` B.9).

## Scripts (`api/package.json`)

| Script | Uso |
|---|---|
| `npm run dev` | nodemon (recarga con cambios en `src/` y `docs/`) |
| `npm start` | producción |
| `npm run lint` | ESLint |
| `npm run migrate` / `migrate:undo` | migraciones |
| `npm run seed` / `seed:undo` | seeders |
