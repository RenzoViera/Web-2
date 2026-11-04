# Arquitectura

## Monorepo

```
/
├─ api/                 API REST (Node + Express 5, ESM)
│  ├─ src/
│  │  ├─ config/        env.js (variables validadas), database.js (Sequelize), zod.js (mensajes en español)
│  │  ├─ models/        modelos Sequelize + asociaciones            (paso 02)
│  │  ├─ repositories/  acceso a datos (únicos que tocan modelos)    (desde paso 03)
│  │  ├─ services/      lógica de negocio y reglas RN-xx
│  │  ├─ controllers/   req → service → res, sin lógica ni queries
│  │  ├─ routes/        routers por dominio, montados en routes/index.js
│  │  ├─ middlewares/   requestId, validate, notFound, errorHandler (+ auth en paso 03)
│  │  ├─ validators/    esquemas Zod por dominio
│  │  ├─ utils/         AppError, errorCodes, pagination, logger
│  │  ├─ app.js         createApp(): middlewares y rutas
│  │  └─ server.js      arranque, conexión a BD y apagado ordenado
│  ├─ db/               config.cjs, migrations/, seeders/ (sequelize-cli, .cjs)
│  ├─ docs/openapi.yaml especificación OpenAPI servida en /api/docs
│  └─ Dockerfile
├─ web/                 SPA (React 19 + Vite 8 + Tailwind v4)
│  ├─ src/              api/, config/, services/, context/, hooks/, routes/, components/, pages/, utils/
│  ├─ nginx.conf        configuración de Nginx para SPA
│  └─ Dockerfile        build multi-etapa Vite → Nginx
├─ docs/                esta documentación
├─ docker-compose.yml   db + api + web (completo)
├─ .env.example         plantilla de variables (un solo .env en la raíz)
├─ REGLAS.md            reglas de desarrollo obligatorias
└─ README.md
```

## Stack

| Capa | Tecnología |
|---|---|
| Runtime | Node 24 LTS (mínimo 22.22) |
| API | Express 5, JavaScript ESM |
| BD / ORM | PostgreSQL 16 + Sequelize 6 + sequelize-cli |
| Validación | Zod 4 (mensajes en español) |
| Seguridad | helmet, cors, express-rate-limit (paso 03), bcrypt + JWT (paso 03) |
| Logs | morgan con `X-Request-Id` + `utils/logger.js` |
| Docs API | swagger-ui-express + `api/docs/openapi.yaml` |
| Frontend | React 19, Vite 8, React Router 8, axios, React Hook Form |
| Estilos | Tailwind CSS v4 con tokens semánticos |
| Lint | ESLint 10 (api) · oxlint (web, viene con la plantilla de Vite) |

## Desviaciones respecto del plan original (justificadas)

| Plan | Implementado | Motivo |
|---|---|---|
| Node 20 | **Node 24 LTS** (Dockerfile `node:24-bookworm-slim`, `engines >=22.22`) | Node 20 llegó a fin de soporte (abril 2026) y React Router 8 exige Node ≥ 22.22. El web del paso 02 debe usar `node:24` para el build. |
| `react-router-dom` | **`react-router`** (v8) | En v8 `react-router-dom` dejó de existir; todo se importa de `react-router` y `RouterProvider` de `react-router/dom`. |
| `sequelize-cli` en devDependencies | **en dependencies** | El contenedor de la API instala solo producción (`npm ci --omit=dev`) y en el paso 02 debe correr `migrate && seed` dentro del contenedor. |
| `CORS_ORIGIN` un origen | **lista separada por comas** | Permite `http://localhost:8080` (Docker) y `http://localhost:5173` (Vite dev) a la vez. |
| `.env.example` con `DB_HOST=db` | **`DB_HOST=localhost`** | Sirve para correr la API fuera de Docker; `docker-compose.yml` fuerza `DB_HOST=db` dentro del contenedor. |
| `.env` solo en la raíz para la API | **también lo lee Vite** (`envDir: '..'`) | Un solo `.env`; Vite solo expone las variables `VITE_*`, los secretos no llegan al bundle. |
| Dependencias extra | `eslint`, `@eslint/js`, `globals` (dev, api) | Lint del backend (no hay runtime extra). |
