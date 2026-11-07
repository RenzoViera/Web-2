# Docker y ejecución local

## Con Docker (forma oficial)

```bash
cp .env.example .env      # cambiar POSTGRES_PASSWORD y JWT_SECRET
docker compose up --build
```

| Servicio | Imagen | Puerto | Detalles |
|---|---|---|---|
| `db` | `postgres:16-alpine` | `5432` | Volumen `db_data`; healthcheck `pg_isready`. |
| `api` | build de `api/Dockerfile` | `3000` | Espera a que `db` esté healthy; `env_file: .env` con `DB_HOST=db` forzado; healthcheck contra `/api/health`; `init: true` para apagado limpio. |
| `web` | build de `web/Dockerfile` | `8080` | Build multi-etapa (Vite en Node 24 → Nginx Alpine). Expuesto en puerto 8080. `VITE_API_URL` llega como build arg desde el `.env` (Vite la incrusta en el build: si cambia, hay que reconstruir con `--build`). |

`api/Dockerfile`: multi-etapa sobre `node:24-bookworm-slim`; la etapa `deps` instala solo dependencias de producción (`npm ci --omit=dev`, capa cacheada mientras no cambie el lockfile) y la imagen final corre como usuario `node` (no root). El comando de arranque corre automáticamente las migraciones y seeders antes de iniciar la API (`npm run migrate && npm run seed && npm start`).

Comandos útiles:

```bash
docker compose logs -f api            # logs de la API (cada línea con su X-Request-Id)
docker compose exec db psql -U miniaula miniaula
docker compose down -v                # borra también la BD (volumen db_data)
```

## Sin Docker (desarrollo)

Requisitos: Node ≥ 22.22 y PostgreSQL 16 (puede ser solo el contenedor: `docker compose up db`).

```bash
cp .env.example .env                  # DB_HOST=localhost ya viene así
cd api && npm install && npm run dev  # http://localhost:3000/api
cd web && npm install && npm run dev  # http://localhost:5173
```

La API y el frontend leen el mismo `.env` de la raíz.
