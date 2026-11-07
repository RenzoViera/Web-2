# Frontend (`web/`)

## Estructura de `src/`

| Carpeta | Contenido |
|---|---|
| `config/env.js` | Lee y valida `VITE_API_URL` (la app no arranca sin ella). |
| `api/` | `axiosClient.js` (instancia única: token, normalización de errores y 401) y `ApiError.js`. |
| `services/` | Una función por endpoint, por dominio (`authService`; `cursosService`... en sus pasos). **Único lugar que usa `axiosClient`.** |
| `context/` | `AuthContext` + `AuthProvider` (sesión) y `ToastContext` + `ToastProvider` (notificaciones). Contexto y provider van en archivos separados (Fast Refresh solo admite componentes en un `.jsx`). |
| `hooks/` | `useAuth`, `useToast`, `useAppForm`, `useDismiss`, `useCopyToClipboard` (+ `useFetch`, `useProgreso` en sus pasos). |
| `routes/` | `AppRouter.jsx`, `paths.js`, `ProtectedRoute`, `RoleRoute`, `GuestRoute`, `redirectState.js`. |
| `components/ui/` | `Button`, `LinkButton`, `TextLink`, `Input`, `PasswordInput`, `RadioCardGroup`, `Alert`, `Avatar`, `Badge`, `Card`, `Toaster`, `Spinner`, `PageLoader`, `ErrorMessage`, `EmptyState`. |
| `components/layout/` | `Layout`, `Navbar`, `UserMenu`, `UserSummary`, `GuestActions`, `NavItemLink`, `AuthCard`, `Logo`, `Footer`, `navItems.js`. |
| `components/errors/` | `ErrorBoundary`, `RouteErrorBoundary`, `GlobalErrorListener`, `ErrorReportView`. |
| `components/icons/` | Íconos SVG propios (sin librerías). |
| `pages/public | account | student | instructor/` | Páginas por acceso (export default para `React.lazy`). `account/`: páginas de cualquier usuario con sesión, sin importar el rol (perfil). |
| `utils/` | `cn`, `errorReport`, `authStorage`, `dedupeRequest`, `validation`, `roles`, `names`, `format`. |

Convenciones: componentes con export nombrado; páginas con export default; imports con alias `@/` (configurado en `vite.config.js` y `jsconfig.json`). Contratos con JSDoc y `checkJs` (se puede verificar con `npx -p typescript tsc --noEmit -p jsconfig.json`).

## Variables de entorno

Vite lee el `.env` de la raíz (`envDir: '..'`) y solo expone las variables `VITE_*`. `VITE_API_URL` se incrusta en el build; en Docker llega como build arg. No hay URLs hardcodeadas en `src/`.

## Cliente HTTP (`api/axiosClient.js`)

- `baseURL = VITE_API_URL`, timeout 15 s.
- Interceptor de request: agrega `Authorization: Bearer <token>`. El token se lee del storage en cada request (si se borra la sesión a mano, el siguiente request sale sin token).
- Interceptor de respuesta: convierte cualquier error en `ApiError { status, code, message, details, requestId }` leyendo el formato `{ error: { status, code, message, details, requestId, timestamp } }` (el `requestId` sale del cuerpo y, si falta, del header `X-Request-Id`). Sin respuesta → `NETWORK_ERROR` o `TIMEOUT` con mensaje en español.
- Ante un **401** avisa al handler registrado con `setUnauthorizedHandler` (lo registra `AuthProvider`) y después rechaza la promesa como siempre.
- Las cancelaciones (`AbortController`) se propagan tal cual; `isRequestCanceled(error)` las detecta.

## Sesión (`context/AuthProvider.jsx`, `useAuth`)

`useAuth()` → `{ user, token, login, register, logout, updateProfile }`.

- **Persistencia:** `utils/authStorage.js` guarda `{ token, user }` en `localStorage` bajo una sola clave (`miniaula.session`) y valida la forma al leer: si está corrupto o editado a mano, se descarta. Si el navegador bloquea el storage, la sesión vive en memoria. El riesgo ante XSS y sus mitigaciones están en [../api/seguridad.md](../api/seguridad.md).
- **Al cargar la app:** arranca con la sesión guardada (sin pantalla de carga) y la valida en segundo plano con `GET /users/me`: una sola petición, compartida si StrictMode monta dos veces (`dedupeRequest`). Si responde, refresca los datos del usuario; 401 → cierra la sesión; sin conexión → toast y se mantiene la sesión guardada; 5xx → manejador global.
- **401 en cualquier request con sesión activa:** cierra la sesión, muestra un toast con el mensaje de la API ("Tu sesión expiró…") y `ProtectedRoute` lleva a `/login` recordando la página. Sin sesión (p. ej. login con credenciales incorrectas) el 401 lo muestra el formulario.
- **Cerrar sesión:** stateless, el cliente borra el token. La navbar primero navega al inicio y después borra la sesión; al revés, `ProtectedRoute` mandaría a `/login`.
- **Varias pestañas:** el evento `storage` sincroniza la sesión, porque el token del storage es el que viaja en cada request.
- **Requests mínimos:** login, registro y edición de perfil hacen 1 request cada uno y su respuesta actualiza la sesión (no se vuelve a pedir `/users/me`).
- Cada cambio de sesión registra al usuario en el reporte de errores (`setErrorReportUser`).

## Rutas y acceso (`routes/`)

| Guard | Dónde | Comportamiento |
|---|---|---|
| `ProtectedRoute` | perfil y rutas de cada rol | Sin sesión → `/login` con `state.from` (página de origen). |
| `RoleRoute roles={[...]}` | dentro de `ProtectedRoute` | Otro rol → inicio de su rol (`homePathFor`). |
| `GuestRoute` | login y registro | Con sesión → `state.from` (solo rutas internas) o inicio del rol. Las páginas de login y registro no navegan por su cuenta: al cambiar la sesión, este guard redirige. |

Inicio de cada rol: estudiante → `/mis-cursos`, instructor → `/instructor/cursos`. Los guards solo ordenan la navegación: la seguridad real está en la API (401/403).

## Formularios (`hooks/useAppForm`, `REGLAS.md` C.39)

```jsx
const RULES = { email: [required('Ingresa tu email'), email('Ingresa un email válido')] }; // fuera del componente

const { register, submit, formError, formState: { errors, isSubmitting } } = useAppForm({ defaultValues, rules: RULES });

<form noValidate onSubmit={submit(async (values) => { await accion(values); })}>
  {formError && <Alert variant="error">{formError}</Alert>}
  <Input label="Email" error={errors.email?.message} {...register('email')} />
  <Button type="submit" loading={isSubmitting}>Guardar</Button>
</form>
```

- Valida cada campo al salir (blur), nunca mientras se escribe; si un campo ya muestra un error, al escribir se revalida solo para limpiarlo. El submit valida todo y enfoca el primer inválido.
- Reglas en `utils/validation.js`: `required`, `email`, `minLength`, `maxLength`. La API vuelve a validar todo; las reglas del cliente solo dan feedback inmediato.
- `submit(fn)` captura lo que lance `fn`:
  - `ApiError` 4xx o sin conexión, con `details` de campos del formulario → error debajo de cada campo (enfoca el primero). Ejemplos: 409 email duplicado, 422 contraseña actual incorrecta.
  - `ApiError` 4xx sin campos → `formError` (p. ej. 401 credenciales incorrectas, 429 demasiados intentos).
  - 5xx o errores que no son de la API → se relanzan al manejador global (aviso con detalle para reportar).
- `setApiErrors(error)` queda expuesto para errores de la API fuera de `submit`.

## Notificaciones (`useToast`)

- `toast.success | error | warning | info(mensaje)`. Reemplazan a `alert` (`REGLAS.md` C.11).
- Debajo de la navbar (arriba a la derecha en escritorio, a todo el ancho en móvil): máximo 3, sin duplicados, botón para cerrar y cierre automático en 4-7 s según el tipo (se pausa con el puntero o el foco encima). La región `aria-live` está siempre montada para que los lectores de pantalla los anuncien.
- Usos del paso 03: sesión vencida, perfil y contraseña actualizados, bienvenida al registrarse y sin conexión al validar la sesión.

## Diseño: tokens (`src/index.css`)

Tailwind v4 con `@theme`. Los componentes usan solo clases semánticas:

| Token | Clase de ejemplo | Uso |
|---|---|---|
| `bg`, `surface`, `surface-muted` | `bg-surface` | Fondos |
| `border`, `border-strong` | `border-border` | Bordes |
| `fg`, `fg-muted`, `fg-subtle`, `fg-inverse` | `text-fg-muted` | Texto |
| `primary` (+ `-hover`, `-active`, `-soft`, `-fg`) | `bg-primary hover:bg-primary-hover` | Acción principal |
| `danger`, `success`, `warning` (+ `-soft`) | `text-danger` | Estados |
| `ring` | `outline-ring` | Foco visible |
| `--animate-fade-in / slide-down / slide-up` | `animate-slide-up` | Animaciones cortas (160-200 ms) |

`prefers-reduced-motion` desactiva animaciones y transiciones globalmente.

## Componentes UI

- **Button**: variantes `primary | secondary | ghost | danger | menu` (ítem de menú alineado a la izquierda), tamaños `sm | md | lg | icon | iconSm`, `fullWidth`. Hover, active (`scale-[0.97]`) y loading integrados: con `loading` o si `onClick` devuelve una promesa muestra spinner, queda `disabled` + `aria-busy` y mantiene el ancho (no hay doble envío). Acepta `ref`. Estilos compartidos en `buttonStyles.js`.
- **LinkButton**: `Link` de React Router con las mismas variantes. **TextLink**: enlace dentro de un texto.
- **Input**: `label` obligatorio, `error`, `hint`, `required` (asterisco + `aria-required`), `end` (contenido a la derecha dentro del campo); `aria-invalid` + `aria-describedby`; compatible con `register()` (en React 19 `ref` es una prop).
- **PasswordInput**: `Input` con botón mostrar/ocultar (`aria-pressed`; con el mouse no le quita el foco al campo, así no dispara la validación).
- **RadioCardGroup**: opciones excluyentes como tarjetas (`legend`, `options: { value, label, description, icon }`, `error`, `hint`). Son radios nativos ocultos dentro de un `radiogroup`: teclado y lector de pantalla funcionan igual. Se le esparce `register('campo')`. Usado para elegir el rol al registrarse.
- **Alert** (`error | warning | success | info`): mensaje en línea, p. ej. el error general de un formulario.
- **Avatar** (iniciales, `sm | md | lg`), **Badge** (`neutral | primary`; antes de sumar variantes de color, verificar contraste AA: success/warning/danger sobre su `-soft` no llegan a 4.5:1), **Card** (`as="section"` opcional).
- **Spinner** (`sm | md | lg`, `decorative` para usar dentro de botones), **PageLoader** (fallback de rutas lazy).
- **ErrorMessage** (`title`, `message`, `onRetry`) y **EmptyState** (`title`, `description`, `action`, `icon`): estados de error y vacío de cualquier vista remota.

## Layout y navegación

- `Layout`: enlace "Saltar al contenido", `Navbar` fija, `<main>` con `Suspense` para páginas lazy, `Footer` y `ScrollRestoration`.
- `Navbar` según sesión y rol (`navItems.js`, `getNavItems(rol)`):
  - Visitante: Catálogo + **Iniciar sesión** / **Crear cuenta**.
  - Estudiante: Catálogo, Mis cursos · Instructor: Catálogo, Panel.
  - Con sesión: `UserMenu` (avatar con iniciales y primer nombre) con nombre, email, rol, **Mi perfil** y **Cerrar sesión**.
  - Debajo de 640 px todo va en el menú hamburguesa (`aria-expanded`/`aria-controls`).
  - Los menús se cierran al navegar, con clic afuera o con Escape (`useDismiss`; con Escape el foco vuelve al botón que los abrió).
- `AuthCard`: marco de login y registro.
- Títulos de página con `<title>` dentro de cada página (React 19 lo sube al `<head>`).

## Router (`routes/AppRouter.jsx`)

`createBrowserRouter` (React Router 8):

```
Layout (errorElement: pantalla completa)
└─ grupo (errorElement: dentro del layout, la navbar sigue visible)
   ├─ /                     HomePage
   ├─ /cursos               ComingSoonPage (catálogo, paso 06)
   ├─ GuestRoute
   │  ├─ /login             LoginPage
   │  └─ /registro          RegisterPage
   ├─ ProtectedRoute
   │  ├─ /perfil            ProfilePage
   │  ├─ RoleRoute estudiante
   │  │  └─ /mis-cursos     ComingSoonPage (paso 06)
   │  └─ RoleRoute instructor
   │     └─ /instructor/cursos  ComingSoonPage (paso 04)
   └─ *                     NotFoundPage
```

Todas las páginas son lazy. Las rutas nuevas se agregan con las constantes de `paths.js`; las de un rol, como hijas de su `RoleRoute`.

## Manejo global de errores

| Origen | Quién lo captura | Cómo se muestra |
|---|---|---|
| Error al renderizar una página | `RouteErrorBoundary` (`errorElement`) | Aviso dentro del layout |
| Error al renderizar el layout/providers | `ErrorBoundary` raíz | Pantalla completa (nunca en blanco) |
| Handlers, timers, promesas sin `catch` | `GlobalErrorListener` (`error` / `unhandledrejection`) | Aviso flotante sin tumbar la pantalla |

El aviso (`ErrorReportView`) tiene 2 niveles: mensaje para el usuario con botones **Copiar detalle** y **Recargar**, y un desplegable **Detalle técnico** con fecha, pantalla, usuario en sesión, error, código/HTTP/`requestId` de la API, navegador, stack y stack de componentes. Se ignoran cancelaciones, `ResizeObserver loop` y errores de extensiones del navegador.

Los errores esperados (validación, 4xx de negocio) **no** usan este aviso: se muestran en el formulario, con toast o con `ErrorMessage`.

## Pendientes de frontend para próximos pasos

- `ConfirmDialog`/`Modal` propios (`REGLAS.md` C.11): crearlos en el primer paso que los necesite (paso 04: eliminar curso).
- Select propio accesible (`REGLAS.md` C.37) para categoría y nivel (paso 04). El rol no lo usa: se elige con `RadioCardGroup`.
- Variantes de `Badge` para el estado del curso (paso 04), con contraste AA.
- Reemplazar `ComingSoonPage` por las páginas reales: cursos del instructor (paso 04), catálogo y mis cursos (paso 06).

## Scripts (`web/package.json`)

| Script | Uso |
|---|---|
| `npm run dev` | Vite en `http://localhost:5173` |
| `npm run build` | build de producción en `dist/` |
| `npm run preview` | sirve el build |
| `npm run lint` | oxlint (reglas de hooks, a11y, sin `console` ni `alert`) |
