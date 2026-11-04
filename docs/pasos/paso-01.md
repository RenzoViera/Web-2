# Paso 01 — Monorepo + base API + base Web + Docker DB

**Responsable:** Renzo · **Rama:** `paso-01-base` · **Fecha:** 2026-11-03

## Qué se hizo

### Repo / raíz
- Commit inicial en `main`: `.gitignore`, `.gitattributes` (finales de línea LF, evita problemas de scripts en Docker desde Windows), `.editorconfig`, `README.md`, `REGLAS.md`.
- `AGENTS.md` queda fuera del repo (`.gitignore`): cada integrante tiene su copia local.
- `.env.example` en la raíz.

### Backend (`api/`)
- Proyecto ESM con scripts `dev`, `start`, `lint`, `migrate`, `seed` (+ `undo`).
- Dependencias del plan instaladas (express 5, sequelize, pg, zod, helmet, cors, morgan, express-rate-limit, jsonwebtoken, bcrypt, swagger-ui-express, yaml, dotenv, sequelize-cli; dev: nodemon, eslint).
- Estructura de capas creada (§2.1 del plan).
- `config/env.js` (Zod, falla al arrancar), `config/database.js`, `config/zod.js` (mensajes en español), `.sequelizerc` + `db/config.cjs`.
- `utils/AppError.js`, `utils/errorCodes.js`, `middlewares/errorHandler.js` (Zod→422, unique→409, JSON inválido→400), `middlewares/notFound.js`, `middlewares/requestId.js`, `utils/logger.js`.
- `middlewares/validate.js` y `utils/pagination.js` + `validators/common.validator.js`.
- `app.js` con helmet, cors, json, morgan, `GET /api/health`, `/api/docs`, notFound y errorHandler; `server.js` con conexión a BD y apagado ordenado.
- `api/Dockerfile` multi-etapa (usuario no root).

Detalle en [../api/backend.md](../api/backend.md).

### Frontend (`web/`)
- Vite + React 19 + Tailwind v4 con tokens de diseño; React Router 8, axios y React Hook Form instalados.
- `api/axiosClient.js` con `VITE_API_URL` y errores normalizados (`ApiError`).
- `Navbar` + `Layout` responsive (menú hamburguesa < 640 px, accesible).
- UI base: `Button`, `LinkButton`, `Input`, `Spinner`, `PageLoader`, `ErrorMessage`, `EmptyState`.
- `AppRouter` con `/` (placeholder) y 404, páginas lazy.
- Manejo global de errores (error boundary, `errorElement`, listener de errores/promesas).

Detalle en [../web/frontend.md](../web/frontend.md).

### Docker
- `docker-compose.yml` con `db` (postgres 16, volumen `db_data`, healthcheck) y `api` (depends_on healthy, `env_file: .env`, healthcheck).

## Cómo probar

```bash
cp .env.example .env && docker compose up --build
```

| Prueba | Esperado |
|---|---|
| `GET http://localhost:3000/api/health` | 200 `{ "status": "ok", "database": "up", ... }` |
| `GET http://localhost:3000/api/noexiste` | 404 `{ "error": { "code": "ROUTE_NOT_FOUND", ... } }` |
| `POST /api/health` con body `{x` y `Content-Type: application/json` | 400 `INVALID_JSON` |
| `http://localhost:3000/api/docs` | Swagger UI con `/health` |
| `cd web && npm install && npm run dev` → `http://localhost:5173` | Layout con navbar; `/cualquier-cosa` muestra la 404 |

Verificado localmente (sin Docker, porque la máquina no tenía Docker Engine): lint de api y web sin errores, build de web OK, health (503 sin BD), 404, JSON inválido 400, validación body 422 / params-query 400 con detalle en español, Swagger UI y CORS con `X-Request-Id` expuesto; sequelize-cli carga `db/config.cjs`. **Falta correr `docker compose up --build` en una máquina con Docker.**

## Notas para el paso 02 (Paye)

- Usar `node:24` (no 20) en la etapa de build del `web/Dockerfile`: React Router 8 exige Node ≥ 22.22.
- `sequelize-cli` ya está en `dependencies`, así que `npm run migrate && npm run seed` funciona dentro del contenedor de producción. Cambiar el `CMD` del `api/Dockerfile` (o un `command` en compose) a `migrate && seed && start`.
- `seederStorage: 'sequelize'` ya está configurado en `db/config.cjs`.
- Los modelos deben definir `tableName` explícito (`usuarios`, `lecciones`...): la pluralización de Sequelize es en inglés.
- Errores de constraints únicos ya se traducen a 409 en `errorHandler`.
