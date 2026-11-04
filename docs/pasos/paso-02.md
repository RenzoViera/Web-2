# Paso 02 — Modelo de datos, migraciones, seed, Docker completo

**Responsable:** Paye · **Rama:** `paso-02-paye` · **Fecha:** 2026-11-04

## Qué se hizo

### Modelos Sequelize (`api/src/models/`)
- Modelos creados con `class ... extends Model` y `tableName` explícito en español:
  - `Usuario` (`usuarios`): campos `id`, `nombre`, `email` (único), `passwordHash`, `rol` (`estudiante` \| `instructor`). `defaultScope` excluye `passwordHash`; scope `conPassword` disponible. Método `validarPassword(plain)`.
  - `Curso` (`cursos`): `instructorId`, `titulo`, `descripcion`, `categoria`, `nivel` (`principiante` \| `intermedio` \| `avanzado`), `estado` (`borrador` \| `publicado` \| `archivado`), `imagenUrl`. Scope `publicados`.
  - `Leccion` (`lecciones`): `cursoId`, `titulo`, `contenido`, `tipo` (`contenido` \| `cuestionario`), `orden`. Scope `porOrden`.
  - `Pregunta` (`preguntas`): `leccionId`, `enunciado`, `opciones` (JSONB), `indiceCorrecto`, `explicacion`. Scope `publico` y función exportada `toPublicPregunta()` para sanitizar respuestas y no exponer la respuesta correcta.
  - `Inscripcion` (`inscripciones`): `usuarioId`, `cursoId` con constraint único compuesto.
  - `ProgresoLeccion` (`progresos_lecciones`): `usuarioId`, `leccionId`, `completada`, `fechaCompletada` con constraint único compuesto.
  - `IntentoCuestionario` (`intentos_cuestionarios`): `usuarioId`, `leccionId`, `puntaje`, `aprobado`, `respuestas` (JSONB), `numeroIntento`.
- Asociaciones bidireccionales completas en `src/models/index.js` (`hasMany` / `belongsTo`) con claves foráneas e integridad referencial (`CASCADE` en dependientes).

### Migraciones y seeders (`api/db/`)
- 7 migraciones CommonJS (`.cjs`) para PostgreSQL:
  - `20261104000001-create-usuarios.cjs`
  - `20261104000002-create-cursos.cjs`
  - `20261104000003-create-lecciones.cjs`
  - `20261104000004-create-preguntas.cjs`
  - `20261104000005-create-inscripciones.cjs`
  - `20261104000006-create-progresos-lecciones.cjs`
  - `20261104000007-create-intentos-cuestionarios.cjs`
- Seeder inicial (`20261104000001-seed-inicial.cjs`):
  - 3 usuarios con contraseña hasheada con bcrypt (`Password123!`): 1 instructor (`instructor@miniaula.com`) y 2 estudiantes (`estudiante1@miniaula.com`, `estudiante2@miniaula.com`).
  - 2 cursos: uno publicado con temario y otro borrador.
  - 3 lecciones: 2 de contenido y 1 cuestionario con 2 preguntas de opción múltiple.
  - 1 inscripción y 1 lección completada como progreso inicial.

### Docker completo
- `api/Dockerfile`: comando de arranque actualizado a `sh -c "npm run migrate && npm run seed && npm start"` para ejecutar migraciones y seeders idempotentes al iniciar el contenedor.
- `web/Dockerfile`: build multi-etapa con Node 24 LTS (`node:24-bookworm-slim`) y runtime Nginx 1.27 Alpine. Argumento de construcción `VITE_API_URL` configurable.
- `web/nginx.conf`: configuración para SPA (`try_files $uri $uri/ /index.html`) y caché inmutable de assets estáticos de Vite.
- `web/.dockerignore`: excluye `node_modules` y `dist`.
- `docker-compose.yml`: agregado servicio `web` expuesto en el puerto 8080 dependiente de `api` (healthy).

## Cómo probar

```bash
cp .env.example .env
docker compose up --build
```

| Prueba | Esperado |
|---|---|
| `GET http://localhost:8080` | Abre la SPA servida por Nginx |
| `GET http://localhost:3000/api/health` | 200 `{ "status": "ok", "database": "up" }` |
| Migraciones y seeders | Corren automáticamente en el arranque de la API |
| `npm run lint` en `api/` | 0 errores |
| `npm run lint` en `web/` | 0 errores |
| `npm run build` en `web/` | Build exitoso en `dist/` |

## Notas para el paso 03

- En el paso 03 se implementan los endpoints de autenticación y perfil (`/auth/register`, `/auth/login`, `/users/me`), middlewares de autenticación JWT y `AuthContext` en el frontend.
- Los modelos `Usuario`, `Curso`, etc. ya están disponibles importando desde `@/models` o `api/src/models/index.js`.
- Usar el scope `Usuario.scope('conPassword')` al autenticar en `/auth/login` para acceder a `passwordHash` y validar con `usuario.validarPassword(password)`.
