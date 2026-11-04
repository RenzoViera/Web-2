# MiniAula

Plataforma de cursos en línea con avance secuencial — Proyecto final de Ingeniería Web 2.

- `api/` — API REST (Node 24, Express 5, Sequelize, PostgreSQL 16)
- `web/` — SPA (React 19, Vite 8, Tailwind CSS v4)
- `docs/` — documentación técnica ([índice](docs/README.md))

Reglas de desarrollo: [REGLAS.md](REGLAS.md).

## Inicio rápido

```bash
cp .env.example .env      # cambiar POSTGRES_PASSWORD y JWT_SECRET
docker compose up --build
```

- API: http://localhost:3000/api/health
- Documentación de la API: http://localhost:3000/api/docs

Desarrollo sin Docker y detalle de servicios: [docs/docker.md](docs/docker.md).
