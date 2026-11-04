# Frontend (`web/`)

## Estructura de `src/`

| Carpeta | Contenido |
|---|---|
| `config/env.js` | Lee y valida `VITE_API_URL` (la app no arranca sin ella). |
| `api/` | `axiosClient.js` (instancia única) y `ApiError.js`. |
| `services/` | Una función por endpoint, por dominio (`authService`, `cursosService`...). **Único lugar que usa `axiosClient`.** Pendiente desde el paso 03. |
| `context/` | Contextos globales (AuthContext en el paso 03). |
| `hooks/` | `useDismiss`, `useCopyToClipboard` (+ `useAuth`, `useFetch`, `useProgreso` en sus pasos). |
| `routes/` | `AppRouter.jsx`, `paths.js` (+ `ProtectedRoute`, `RoleRoute` en el paso 03). |
| `components/ui/` | `Button`, `LinkButton`, `Input`, `Spinner`, `PageLoader`, `ErrorMessage`, `EmptyState`. |
| `components/layout/` | `Layout`, `Navbar`, `NavItemLink`, `Logo`, `Footer`, `navItems.js`. |
| `components/errors/` | `ErrorBoundary`, `RouteErrorBoundary`, `GlobalErrorListener`, `ErrorReportView`. |
| `components/icons/` | Íconos SVG propios (sin librerías). |
| `pages/public | student | instructor/` | Páginas por rol (export default para `React.lazy`). |
| `utils/` | `cn` (clases condicionales), `errorReport`. |

Convenciones: componentes con export nombrado; páginas con export default; imports con alias `@/` (configurado en `vite.config.js` y `jsconfig.json`).

## Variables de entorno

Vite lee el `.env` de la raíz (`envDir: '..'`) y solo expone las variables `VITE_*`. `VITE_API_URL` se incrusta en el build; en Docker (paso 02) llega como build arg. No hay URLs hardcodeadas en `src/`.

## Cliente HTTP (`api/axiosClient.js`)

- `baseURL = VITE_API_URL`, timeout 15 s.
- Interceptor de respuesta: convierte cualquier error en `ApiError { status, code, message, details, requestId }` leyendo el formato `{ error: { code, message, details } }` y el header `X-Request-Id`. Sin respuesta → `NETWORK_ERROR` o `TIMEOUT` con mensaje en español.
- Las cancelaciones (`AbortController`) se propagan tal cual; `isRequestCanceled(error)` las detecta.
- Pendiente (paso 03): interceptor de request con `Authorization: Bearer` y manejo de 401 (logout + redirect a `/login`).

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

- **Button**: variantes `primary | secondary | ghost | danger`, tamaños `sm | md | lg | icon`, `fullWidth`. Hover, active (`scale-[0.97]`) y loading integrados: con `loading` o si `onClick` devuelve una promesa muestra spinner, queda `disabled` + `aria-busy` y mantiene el ancho (no hay doble envío). Estilos compartidos en `buttonStyles.js`.
- **LinkButton**: `Link` de React Router con las mismas variantes.
- **Input**: `label` obligatorio, `error`, `hint`; `aria-invalid` + `aria-describedby`; compatible con `register()` de React Hook Form (en React 19 `ref` es una prop).
- **Spinner** (`sm | md | lg`, `decorative` para usar dentro de botones), **PageLoader** (fallback de rutas lazy).
- **ErrorMessage** (`title`, `message`, `onRetry`) y **EmptyState** (`title`, `description`, `action`, `icon`): estados de error y vacío de cualquier vista remota.

## Layout y navegación

- `Layout`: enlace "Saltar al contenido", `Navbar` fija, `<main>` con `Suspense` para páginas lazy, `Footer` y `ScrollRestoration`.
- `Navbar`: enlaces en línea desde 640 px; debajo, botón hamburguesa con `aria-expanded`/`aria-controls`. El menú se cierra al navegar, con clic afuera o con Escape (`useDismiss`). Los ítems salen de `navItems.js`; pendiente (paso 03): ítems según sesión y rol.
- Títulos de página con `<title>` dentro de cada página (React 19 lo sube al `<head>`).

## Router (`routes/AppRouter.jsx`)

`createBrowserRouter` (React Router 8):

```
Layout (errorElement: pantalla completa)
└─ grupo (errorElement: dentro del layout, la navbar sigue visible)
   ├─ /   HomePage (lazy)
   └─ *   NotFoundPage (lazy)
```

Las rutas nuevas se agregan como hijas del grupo usando las constantes de `paths.js`.

## Manejo global de errores

| Origen | Quién lo captura | Cómo se muestra |
|---|---|---|
| Error al renderizar una página | `RouteErrorBoundary` (`errorElement`) | Aviso dentro del layout |
| Error al renderizar el layout/providers | `ErrorBoundary` raíz | Pantalla completa (nunca en blanco) |
| Handlers, timers, promesas sin `catch` | `GlobalErrorListener` (`error` / `unhandledrejection`) | Aviso flotante sin tumbar la pantalla |

El aviso (`ErrorReportView`) tiene 2 niveles: mensaje para el usuario con botones **Copiar detalle** y **Recargar**, y un desplegable **Detalle técnico** con fecha, pantalla, usuario, error, código/HTTP/`requestId` de la API, navegador, stack y stack de componentes. Se ignoran cancelaciones, `ResizeObserver loop` y errores de extensiones del navegador.
Pendiente (paso 03): al iniciar sesión, llamar `setErrorReportUser(user)` (`utils/errorReport.js`) para que el reporte incluya al usuario.

Los errores esperados (validación, 4xx de negocio) **no** usan este aviso: se muestran en el formulario o con `ErrorMessage`.

## Pendientes de frontend para próximos pasos

- Toasts/notificaciones y diálogo de confirmación propio (`REGLAS.md` C.11): crear una sola vez en el primer paso que los necesite (paso 03/04).
- Select propio accesible (`REGLAS.md` C.37) para rol (paso 03), categoría y nivel (paso 04).
- Hook de formularios con validación al salir del campo (`REGLAS.md` C.39) junto con las páginas de login/registro (paso 03).

## Scripts (`web/package.json`)

| Script | Uso |
|---|---|
| `npm run dev` | Vite en `http://localhost:5173` |
| `npm run build` | build de producción en `dist/` |
| `npm run preview` | sirve el build |
| `npm run lint` | oxlint (reglas de hooks, a11y, sin `console` ni `alert`) |
