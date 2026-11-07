# Paso 03 — Autenticación (API + Web)

**Responsable:** Renzo · **Rama:** `paso-03-auth` · **Fecha:** 2026-11-07

## Qué se hizo

### Reglas y correcciones de pasos anteriores
- `REGLAS.md` §B reescrita con la skill `backend-rules-general` (B.1–B.28) y ajustes en §A. En §C, C.11 (toasts) y C.39 (`useAppForm`) quedan como implementadas.
- Lo que ya existía y no cumplía las reglas se corrigió en commits aparte:
  - Error de la API con `status`, `requestId` y `timestamp`; los 5xx se loguean con usuario y solo el stack.
  - El web toma el `requestId` del cuerpo del error (con el header como respaldo).
  - `Usuario` sin scope `conPassword` ni `validarPassword`: el repositorio pide columnas explícitas y bcrypt vive en el servicio.
  - Migración nueva `20261107000001-add-indices-fk.cjs`: índices en FKs que nada cubría (`cursos.instructorId`, `inscripciones.cursoId`, `progresos_lecciones.leccionId`, `intentos_cuestionarios.leccionId`).
  - `docker-compose.yml`: `VITE_API_URL` del web sale del `.env` (con valor por defecto).
  - Documentación nueva del modelo de datos ([../api/modelo-datos.md](../api/modelo-datos.md)).

### Backend (`api/`)
- `validators/auth.validator.js`: register, login, updateMe (al menos un campo; `passwordActual` obligatoria si viene `password`) y forma del payload del token.
- `repositories/usuario.repository.js` (columnas explícitas, `UPDATE … RETURNING` en una consulta), `services/auth.service.js` y `services/usuario.service.js`.
- Endpoints:
  - `POST /auth/register` → 201 `{ user, token }`; 409 `EMAIL_TAKEN`.
  - `POST /auth/login` → 200 `{ user, token }`; 401 genérico `INVALID_CREDENTIALS`; 429 tras 5 intentos fallidos por minuto e IP.
  - `GET /users/me`; `PUT /users/me` (nombre, email y/o contraseña con la actual; el rol no se edita).
- Middlewares `authenticate` (no consulta la BD: el JWT trae `{ id, rol }`), `authorize(...roles)` y `loginRateLimit`.
- bcrypt costo 10 (con hash ficticio para no revelar qué emails existen) y JWT HS256 con algoritmo fijado al verificar.
- Cierre de sesión stateless, documentado en Swagger. `openapi.yaml` con `bearerAuth`, ejemplos y errores.

Detalle en [../api/backend.md](../api/backend.md) y [../api/seguridad.md](../api/seguridad.md).

### Frontend (`web/`)
- `axiosClient`: `Authorization: Bearer` en cada request y aviso de cualquier 401 al `AuthProvider`.
- `services/authService.js`; `AuthContext`/`AuthProvider` + `useAuth`:
  - Sesión persistida en `localStorage` y validada con `GET /users/me` al cargar.
  - Un 401 cierra la sesión con un toast.
  - La sesión se sincroniza entre pestañas.
- Toasts propios (`useToast`) y hook de formularios `useAppForm` (valida al salir del campo y muestra los errores de la API por campo o generales).
- `ProtectedRoute`, `RoleRoute` y `GuestRoute` (después de iniciar sesión vuelve a la página de origen).
- Páginas:
  - `LoginPage`.
  - `RegisterPage`, con el rol elegido en tarjetas de opción.
  - `ProfilePage`, con datos personales y cambio de contraseña.
- Navbar según sesión y rol: Catálogo, Mis cursos / Panel y menú de usuario con avatar de iniciales, Mi perfil y Cerrar sesión. También en el menú móvil.
- UI nueva: `PasswordInput`, `RadioCardGroup`, `Alert`, `Avatar`, `Badge`, `Card`, `TextLink`; `Input` con slot `end`; `Button` con variante `menu` y tamaño `iconSm`.
- `/cursos`, `/mis-cursos` y `/instructor/cursos` muestran un marcador (`ComingSoonPage`) hasta los pasos 04 y 06.

Detalle en [../web/frontend.md](../web/frontend.md).

## Cómo probar

```bash
cp .env.example .env   # si todavía no existe
docker compose up --build
```

Al arrancar, la API aplica las migraciones pendientes (incluida la de índices) y el seed. Usuarios de prueba: `instructor@miniaula.com`, `estudiante1@miniaula.com`, `estudiante2@miniaula.com`, todos con contraseña `Password123!`.

| Prueba | Esperado |
|---|---|
| Registrar un estudiante y un instructor en `/registro` | Toast de bienvenida, redirige a Mis cursos / Panel y la navbar muestra el avatar |
| Registrar con un email ya usado | "Ya existe una cuenta con ese email" debajo del campo (409) |
| Login con contraseña incorrecta | "Email o contraseña incorrectos" (401) |
| 6 logins fallidos seguidos en menos de 1 minuto | El 6.º muestra "Demasiados intentos…" (429) |
| Recargar la página con sesión iniciada | La sesión se mantiene; en Network se ve un solo `GET /users/me` |
| Borrar `miniaula.session` (DevTools → Application) y guardar un cambio del perfil | Toast "Debes iniciar sesión para continuar", va a `/login` y al entrar vuelve a `/perfil` |
| Estudiante abre `/instructor/cursos` | Redirigido a `/mis-cursos` (y el instructor que abre `/mis-cursos`, a `/instructor/cursos`) |
| Sin sesión abre `/perfil` | Redirigido a `/login`; después de entrar vuelve a `/perfil` |
| Perfil: cambiar nombre o email | Toast "Tus datos se actualizaron" y la navbar se actualiza |
| Perfil: contraseña actual incorrecta | Error debajo de "Contraseña actual" (422) |
| `GET /api/users/me` sin token (Swagger o curl) | 401 `UNAUTHORIZED` con `requestId` |
| `PUT /api/users/me` con `rol` en el body | 200; el rol no cambia |

### Verificado en esta máquina (sin Docker)
- api: ESLint sin errores. La app carga con variables de prueba. Se revisó el SQL de los repositorios (columnas exactas, `UPDATE … RETURNING`). Se probaron `verifyToken` (token inválido, vencido y payload raro) y `verifyPassword`. El OpenAPI parsea sin referencias rotas.
- web: oxlint sin warnings, `vite build` OK y chequeo de tipos JSDoc (`tsc --noEmit -p jsconfig.json`) sin errores.
- **Pendiente:** el recorrido de "Cómo probar" con `docker compose up --build`. No se corrió contra Postgres y la migración nueva todavía no se aplicó en ninguna base.

## Notas para el paso 04 (Paye)

- Rutas del instructor: `authenticate, authorize(ROLES.INSTRUCTOR), validate(...)` (`ROLES` en `utils/roles.js`). `req.user` es `{ id, rol }`, sin consultar la BD.
- Errores: `throw new AppError(status, ERROR_CODES.X, mensaje, details?)`. Las violaciones de unique se traducen en el servicio con `isUniqueViolation(error, 'campo')` (`utils/dbErrors.js`), como en `auth.service.js`.
- Repositorios con `attributes` explícitos; datos de usuario (p. ej. el nombre del instructor) siempre sin `passwordHash`. El módulo de referencia con todas las capas es auth/usuarios.
- Web:
  - Las páginas del instructor van como hijas del `RoleRoute` de instructor en `AppRouter` (reemplazar el marcador de `/instructor/cursos`).
  - Formularios con `useAppForm` y reglas constantes; avisos con `useToast`.
  - Para eliminar un curso falta `ConfirmDialog`; categoría y nivel necesitan el `Select` propio (`REGLAS.md` C.37); el estado del curso, variantes nuevas de `Badge` con contraste AA.
- Revisar las diferencias del modelo con el plan antes de los pasos 05 y 07 (`notaMinima`, `videoUrl`, `inscripciones.completado`…): [../api/modelo-datos.md](../api/modelo-datos.md).
