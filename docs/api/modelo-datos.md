# Modelo de datos

PostgreSQL 16 con Sequelize 6. El esquema lo definen las migraciones de `api/db/migrations/` (sequelize-cli, `.cjs`);
los modelos de `api/src/models/` lo reflejan y `models/index.js` declara las asociaciones.
Todas las tablas tienen `id` (`INTEGER`, autoincremental) y `createdAt` / `updatedAt` (`TIMESTAMPTZ`).

## Tablas

### `usuarios` (`Usuario`)

| Columna | Tipo | Nulo | Default | Notas |
|---|---|---|---|---|
| `nombre` | `VARCHAR(100)` | no | | |
| `email` | `VARCHAR(255)` | no | | **UNIQUE**. La API lo guarda recortado y en minúsculas. |
| `passwordHash` | `VARCHAR(255)` | no | | bcrypt. Nunca sale en una respuesta (`toPublicUsuario`). |
| `rol` | `ENUM('estudiante','instructor')` | no | `estudiante` | Se elige al registrarse; no es editable. |

### `cursos` (`Curso`)

| Columna | Tipo | Nulo | Default | Notas |
|---|---|---|---|---|
| `instructorId` | `INTEGER` → `usuarios.id` | no | | `ON DELETE RESTRICT` |
| `titulo` | `VARCHAR(200)` | no | | |
| `descripcion` | `TEXT` | sí | | |
| `categoria` | `VARCHAR(100)` | no | | |
| `nivel` | `ENUM('principiante','intermedio','avanzado')` | no | `principiante` | |
| `estado` | `ENUM('borrador','publicado','archivado')` | no | `borrador` | El catálogo solo muestra `publicado` (RN-05). |
| `imagenUrl` | `VARCHAR(500)` | sí | | |

### `lecciones` (`Leccion`)

| Columna | Tipo | Nulo | Default | Notas |
|---|---|---|---|---|
| `cursoId` | `INTEGER` → `cursos.id` | no | | `ON DELETE CASCADE` |
| `titulo` | `VARCHAR(200)` | no | | |
| `contenido` | `TEXT` | sí | | En cuestionarios: instrucciones opcionales. |
| `videoUrl` | `VARCHAR(500)` | sí | | Solo contenido (paso 05). |
| `tipo` | `ENUM('contenido','cuestionario')` | no | `contenido` | No editable después de crear. |
| `orden` | `INTEGER` | no | `1` | Posición 1..n dentro del curso (sin huecos). |
| `notaMinima` | `INTEGER` | sí | | 0–100, solo cuestionarios (paso 05). |

### `preguntas` (`Pregunta`)

| Columna | Tipo | Nulo | Default | Notas |
|---|---|---|---|---|
| `leccionId` | `INTEGER` → `lecciones.id` | no | | `ON DELETE CASCADE` |
| `enunciado` | `TEXT` | no | | |
| `opciones` | `JSONB` | no | | Array de strings (≥ 2, validado en el modelo). |
| `indiceCorrecto` | `INTEGER` | no | | Nunca sale al estudiante (RN-02, `toPublicPregunta`). |
| `explicacion` | `TEXT` | sí | | |

### `inscripciones` (`Inscripcion`)

| Columna | Tipo | Nulo | Notas |
|---|---|---|---|
| `usuarioId` | `INTEGER` → `usuarios.id` | no | `ON DELETE CASCADE` |
| `cursoId` | `INTEGER` → `cursos.id` | no | `ON DELETE CASCADE` (borrar un curso con inscritos lo impide el servicio, RN-06) |
| `completado` | `BOOLEAN` | no | Agregada en `20261112000001-add-completado-inscripciones.cjs` (default `false`; se marca `true` al completar todas las lecciones). |

### `progresos_lecciones` (`ProgresoLeccion`)

| Columna | Tipo | Nulo | Default | Notas |
|---|---|---|---|---|
| `usuarioId` | `INTEGER` → `usuarios.id` | no | | `ON DELETE CASCADE` |
| `leccionId` | `INTEGER` → `lecciones.id` | no | | `ON DELETE CASCADE` |
| `completada` | `BOOLEAN` | no | `false` | |
| `fechaCompletada` | `TIMESTAMPTZ` | sí | | |

### `intentos_cuestionarios` (`IntentoCuestionario`)

| Columna | Tipo | Nulo | Default | Notas |
|---|---|---|---|---|
| `usuarioId` | `INTEGER` → `usuarios.id` | no | | `ON DELETE CASCADE` |
| `leccionId` | `INTEGER` → `lecciones.id` | no | | `ON DELETE CASCADE` |
| `puntaje` | `INTEGER` | no | | 0–100 (validado en el modelo). |
| `aprobado` | `BOOLEAN` | no | `false` | |
| `respuestas` | `JSONB` | sí | | |
| `numeroIntento` | `INTEGER` | no | `1` | |

## Índices

| Tabla | Columnas | Tipo | Para qué |
|---|---|---|---|
| `usuarios` | `email` | UNIQUE | Login por email; un email por cuenta. |
| `cursos` | `categoria` | | Filtro del catálogo. |
| `cursos` | `estado` | | Catálogo: solo publicados. |
| `cursos` | `instructorId` | | Cursos de un instructor (FK). |
| `lecciones` | `cursoId`, `orden` | | Temario ordenado de un curso (FK). |
| `preguntas` | `leccionId` | | Preguntas de un cuestionario (FK). |
| `inscripciones` | `usuarioId`, `cursoId` | UNIQUE | Sin doble inscripción (RN-04); cursos de un estudiante (FK). |
| `inscripciones` | `cursoId` | | Inscritos de un curso (FK). |
| `inscripciones` | `cursoId`, `completado` | | Conteo de estudiantes que completaron el curso (paso 09). |
| `progresos_lecciones` | `usuarioId`, `leccionId` | UNIQUE | Un progreso por estudiante y lección (FK). |
| `progresos_lecciones` | `leccionId` | | Avance por lección en el panel (FK). |
| `intentos_cuestionarios` | `usuarioId`, `leccionId` | | Intentos de un estudiante en un cuestionario (FK). |
| `intentos_cuestionarios` | `leccionId` | | Notas por cuestionario en el panel (FK). |

Los índices de `instructorId`, `inscripciones.cursoId` y de `leccionId` en progresos e intentos los agrega
`20261107000001-add-indices-fk.cjs`: en Postgres las FKs no se indexan solas y un índice compuesto solo sirve
para filtrar por su primera columna (`REGLAS.md` B.21).

## Asociaciones (`models/index.js`)

| Relación | Alias |
|---|---|
| `Usuario` 1-N `Curso` (`instructorId`) | `usuario.cursos` / `curso.instructor` |
| `Curso` 1-N `Leccion` | `curso.lecciones` / `leccion.curso` |
| `Leccion` 1-N `Pregunta` | `leccion.preguntas` / `pregunta.leccion` |
| `Usuario` 1-N `Inscripcion` | `usuario.inscripciones` / `inscripcion.estudiante` |
| `Curso` 1-N `Inscripcion` | `curso.inscripciones` / `inscripcion.curso` |
| `Usuario` 1-N `ProgresoLeccion` | `usuario.progresos` / `progreso.estudiante` |
| `Leccion` 1-N `ProgresoLeccion` | `leccion.progresos` / `progreso.leccion` |
| `Usuario` 1-N `IntentoCuestionario` | `usuario.intentos` / `intento.estudiante` |
| `Leccion` 1-N `IntentoCuestionario` | `leccion.intentos` / `intento.leccion` |

## Scopes y sanitizadores

- `Usuario`: `defaultScope` excluye `passwordHash`. Es una red de seguridad: los repositorios piden columnas
  explícitas (`attributes`) y con `attributes` explícito el `exclude` no aplica, así que el repositorio decide.
  Las respuestas pasan por `toPublicUsuario()` (`api/src/utils/sanitizers.js`).
- `Curso`: scope `publicados` (`estado = 'publicado'`).
- `Leccion`: scope `porOrden` (`ORDER BY orden`).
- `Pregunta`: scope `publico` (sin `indiceCorrecto`) y `toPublicPregunta()`, el único sanitizador de preguntas.

## Datos de prueba (seed)

`20261104000001-seed-inicial.cjs` (corre una sola vez, `seederStorage: 'sequelize'`). Contraseña de todos: `Password123!`.

| Email | Rol |
|---|---|
| `instructor@miniaula.com` | instructor |
| `estudiante1@miniaula.com` | estudiante (inscrito en el curso publicado, lección 1 completada) |
| `estudiante2@miniaula.com` | estudiante |

Cursos: uno publicado (3 lecciones; la 3.ª es un cuestionario de 2 preguntas) y uno en borrador.

## Diferencias con el plan (pendientes)

| Plan | Estado actual | Paso que lo necesita |
|---|---|---|
| `progresos` por `inscripcionId` con `intentos` y `mejorNota` | Progreso por `usuarioId` + tabla `intentos_cuestionarios` (intentos = `COUNT`, mejor nota = `MAX(puntaje)`) | 08 |
| Seed: 2 instructores, 3 estudiantes, 3 cursos × 5 lecciones | 1 instructor, 2 estudiantes, 2 cursos | 09 (panel con datos) |

Cada cambio de esquema va en una migración nueva (`REGLAS.md` B.14).
