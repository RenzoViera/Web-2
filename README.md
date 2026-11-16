# MiniAula

Plataforma de cursos en línea con **avance secuencial** — Proyecto final de Ingeniería Web 2.

Los instructores crean cursos con lecciones de contenido (texto y video) y cuestionarios de opción múltiple, los
publican y siguen el avance de sus estudiantes en un panel. Los estudiantes se inscriben desde el catálogo y avanzan
en orden: cada lección se desbloquea al completar la anterior y un cuestionario cuenta como completado solo al
aprobarlo (máximo 3 intentos, se guarda la mejor nota). Todas las reglas se validan en el servidor y las respuestas
correctas nunca llegan al navegador del estudiante.

- `api/`: API REST (Node 24, Express 5, Sequelize, PostgreSQL 16)
- `web/`: SPA (React 19, Vite 8, Tailwind CSS v4)
- `docs/`: documentación técnica ([índice](docs/README.md))

Reglas de desarrollo: [REGLAS.md](REGLAS.md).

**Video de demostración:** _pendiente (se agrega el enlace de YouTube no listado al grabarlo)._

## Stack

| Capa | Tecnología |
|---|---|
| API | Node 24 LTS, Express 5 (JavaScript ESM), Zod 4, bcrypt + JWT, helmet, cors, express-rate-limit, morgan |
| Base de datos | PostgreSQL 16, Sequelize 6 + sequelize-cli (migraciones y seeders) |
| Documentación de la API | OpenAPI 3 (`api/docs/openapi.yaml`) con swagger-ui-express |
| Frontend | React 19, Vite 8, React Router 8, Context API, axios, React Hook Form, Tailwind CSS v4 |
| Infraestructura | Docker Compose: `db` (Postgres), `api` (Node) y `web` (build de Vite servido por Nginx) |

## Cómo levantarlo

Requisito: Docker con Docker Compose.

```bash
git clone <url-del-repo> miniaula && cd miniaula
cp .env.example .env      # cambiar POSTGRES_PASSWORD y JWT_SECRET (mínimo 32 caracteres)
docker compose up --build
```

Al arrancar, la API aplica las migraciones y carga los datos de prueba sola (`migrate && seed && start`). El seed corre
una sola vez: si ya se aplicó, no duplica datos.

| Servicio | URL |
|---|---|
| Web | http://localhost:8080 |
| API | http://localhost:3000/api (salud: `/api/health`) |
| Documentación de la API (Swagger) | http://localhost:3000/api/docs |

Comandos útiles:

```bash
docker compose exec api npm run seed     # correr los seeders a mano (los ya aplicados se saltean)
docker compose exec api npm run migrate  # aplicar migraciones pendientes a mano
docker compose logs -f api               # logs de la API (cada línea con su X-Request-Id)
docker compose down -v                   # apagar y borrar la base (volumen db_data); el próximo up re-siembra
```

Para desarrollar sin Docker (API con nodemon y Vite en `:5173`): [docs/docker.md](docs/docker.md).

## Variables de entorno

Un solo `.env` en la raíz, lo leen la API, Docker Compose y Vite. Plantilla: [`.env.example`](.env.example).

| Variable | Ejemplo | Uso |
|---|---|---|
| `POSTGRES_USER` | `miniaula` | Usuario de Postgres (lo crea el contenedor `db`) |
| `POSTGRES_PASSWORD` | `cambiar_esto` | Contraseña de Postgres. **Cambiarla.** |
| `POSTGRES_DB` | `miniaula` | Nombre de la base |
| `DB_HOST` | `localhost` | Host de la base para la API fuera de Docker; Compose lo fuerza a `db` |
| `DB_PORT` | `5432` | Puerto de Postgres |
| `API_PORT` | `3000` | Puerto de la API |
| `JWT_SECRET` | — | Secreto para firmar los tokens. **Mínimo 32 caracteres.** |
| `JWT_EXPIRES_IN` | `2h` | Duración del token |
| `CORS_ORIGIN` | `http://localhost:8080,http://localhost:5173` | Orígenes permitidos, separados por coma |
| `VITE_API_URL` | `http://localhost:3000/api` | URL de la API que usa la web. Vite la incrusta en el build: si cambia, `docker compose up --build` |

La API valida las variables al arrancar y se detiene con un mensaje claro si falta alguna.

## Usuarios de prueba

Contraseña de todos: **`Password123!`**

| Email | Rol | Qué tiene |
|---|---|---|
| `instructor@miniaula.com` | Instructor | Dueño de los 3 cursos (2 publicados y 1 en borrador), con datos en el panel |
| `instructor2@miniaula.com` | Instructor | Sin cursos: sirve para comprobar que no puede tocar cursos ajenos (403) |
| `estudiante1@miniaula.com` | Estudiante | Terminó "Introducción a JavaScript Moderno" (cuestionario aprobado) |
| `estudiante2@miniaula.com` | Estudiante | En "JavaScript Moderno": reprobó el cuestionario (le quedan 2 intentos) |
| `estudiante3@miniaula.com` | Estudiante | En "Backend con Node.js": completó la primera lección |

Para ver el bloqueo secuencial desde cero, registrar un estudiante nuevo e inscribirse a un curso.

## Funcionalidades

- **Cuentas:** registro con rol (estudiante o instructor), inicio de sesión con límite de intentos, sesión persistente y
  perfil editable.
- **Catálogo:** solo cursos publicados, búsqueda por título, filtro por categoría y paginación; detalle con temario
  (sin el contenido de las lecciones).
- **Estudiante:** inscripción (sin duplicados), Mis cursos con porcentaje de avance, vista de lección con temario,
  lecciones bloqueadas hasta completar la anterior, video embebido y cuestionarios calificados en el servidor.
- **Instructor:** crear, editar, publicar, archivar y eliminar cursos (no si tiene inscritos); lecciones con
  reordenamiento; preguntas de opción múltiple con nota mínima; panel con inscritos, progreso promedio, nota promedio,
  estudiantes que llegaron a cada lección y la lección donde más se detienen.

## Cambios al modelo de datos del enunciado (justificados)

| Enunciado | Implementado | Por qué |
|---|---|---|
| `progresos` por inscripción, con `intentos` y `mejorNota` | `progresos_lecciones` por estudiante y lección + tabla `intentos_cuestionarios` (un registro por intento) | Guarda cada intento con su nota y respuestas; los intentos se cuentan y la mejor nota es el máximo, sin contadores que puedan desincronizarse. El tope de 3 se garantiza con un bloqueo de fila en una transacción. |
| `inscripciones` sin estado | Columna `completado` | Mis cursos y el panel saben quién terminó el curso sin recalcularlo en cada consulta. |
| Cursos y preguntas con los campos mínimos | `cursos.imagenUrl` y `preguntas.explicacion` opcionales | Portada en las cards y una explicación opcional que ve el instructor en el editor. |

Detalle de tablas, índices y asociaciones: [docs/api/modelo-datos.md](docs/api/modelo-datos.md). Otras desviaciones
técnicas del plan (Node 24, React Router 8, etc.): [docs/arquitectura.md](docs/arquitectura.md#desviaciones-respecto-del-plan-original-justificadas).

## Documentación

| Documento | Contenido |
|---|---|
| [docs/api/endpoints.md](docs/api/endpoints.md) | Todos los endpoints con su acceso |
| [docs/api/seguridad.md](docs/api/seguridad.md) | Autenticación, autorización y matriz de acceso |
| [docs/api/backend.md](docs/api/backend.md) | Capas, errores, validación, paginación y logs de la API |
| [docs/web/frontend.md](docs/web/frontend.md) | Estructura de la SPA, sesión, rutas, formularios y pantallas |
| [docs/pasos/](docs/pasos/) | Registro de cada paso del desarrollo |
