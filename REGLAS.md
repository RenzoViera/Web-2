# REGLAS.md — Reglas de desarrollo de MiniAula

> Reglas obligatorias para los integrantes y para cualquier agente IA (Claude, Codex, Copilot…).
> Complementan el plan de pasos (`AGENTS.md`, local de cada integrante). Ante conflicto, manda este archivo en
> lo que respecta a **cómo** se escribe el código; el plan manda en **qué** se hace en cada paso.
> La numeración de backend y frontend es fija (hay referencias cruzadas): no renumerar, solo agregar al final.
> §B incorpora la skill `backend-rules-general` y §C la skill `frontend-rules-general`, adaptadas a este stack.

---

## A. Generales

- Stack, estructura y convenciones fijas: Express 5 + JS ESM, Sequelize + PostgreSQL 16, Zod, React + Vite + Tailwind v4, React Router 8 (`react-router`), Context API, axios, React Hook Form. No agregar librerías sin anotarlo en las notas del paso.
- Conventional Commits (`feat(api): …`, `feat(web): …`, `fix(…)`, `chore(docker): …`, `docs: …`), commits pequeños, todo entra a `main` por PR.
- Nunca commitear `.env` ni secretos. Nunca hardcodear URLs (`VITE_API_URL`) ni credenciales.
- Sin `console.log` de debug, código comentado ni dead code.
- Nombres de dominio en español (`curso`, `leccion`, `inscripcion`), código técnico en inglés (`service`, `repository`, `validate`).
- Archivos: componentes y páginas `PascalCase.jsx`; hooks `useXxx.js`; servicios `xxxService.js` (web) / `xxx.service.js` (api).
- Implementación grande (módulo nuevo, flujo completo, cambio de modelo de datos o que toca varios endpoints o pantallas): antes de empezar, juntar todas las dudas de alcance, modelo de datos, permisos, contratos de API, dependencias o diseño en **una sola ronda** de preguntas; no suponer nada importante. Plan aprobado → ejecutar de punta a punta, sin consultas por cada paso.
- Agentes IA: no hacer checkout, commit ni push sin pedido explícito; trabajar en la rama que indique el usuario (por defecto la del paso, `paso-NN-slug`) y, si no la indicó, preguntar antes de commitear.
- Agentes IA: las reglas se aplican en silencio; no anunciar "no ejecuto X porque la regla lo prohíbe" ni repetir por qué algo no se corre. Al entregar, informar qué se verificó.

## B. Backend (`api/`)

### Arquitectura, validación y errores

1. Capas: `routes` → `middlewares` → `controllers` (req → service → res, **sin lógica ni queries**) → `services` (reglas RN-xx) → `repositories` (únicos que tocan modelos).
2. Toda entrada se valida y tipa en el borde con `validate({ body, params, query })` y esquemas Zod de `validators/`; nunca usar body, query o params crudos. Reusar `validators/common.validator.js` (`idParamSchema`, `paginationQuerySchema`).
3. Todo error se lanza con `throw new AppError(status, ERROR_CODES.X, mensaje, details)`. Express 5 propaga errores async: no usar `try/catch` solo para hacer `next(err)`.
4. Un único manejador global (`middlewares/errorHandler.js`) con formato fijo `{ error: { status, code, message, details, requestId, timestamp } }`; el `requestId` viaja también en el header `X-Request-Id`. 4xx con un mensaje legible para el usuario final (el front lo muestra tal cual). 5xx con mensaje genérico (sin SQL, stack ni nombres internos) y log `[requestId] MÉTODO url 500 user=<id>` + stack: el `requestId` es el código que el usuario copia del aviso y le pasa al administrador, así que tiene que poder buscarse en el log.
5. Códigos HTTP (§2.2 del plan): body inválido → 422; query/params inválidos o JSON mal formado → 400; sin token o token inválido → 401; rol incorrecto o recurso ajeno → 403; inexistente → 404; duplicado o con dependencias → 409. Los errores esperables de la BD (unique, FK) se traducen a 4xx **en el servicio** con `utils/dbErrors.js`, nunca comparando textos de mensajes de Postgres; el mapeo del `errorHandler` es solo la red de seguridad.
6. Listados siempre paginados y con tope (`limit` máx. 50): `getPagination(query)` + `buildPaginatedResponse(rows, count, pagination)` → `{ data, meta }`. Nunca colecciones sin acotar.
7. Nunca devolver `passwordHash` ni `indiceCorrecto` (salvo editor del instructor dueño). Sanitizadores únicos: `toPublicUsuario()` (`utils/sanitizers.js`) y `toPublicPregunta()`.
8. Secretos y configuración solo por variables de entorno vía `config/env.js` (validadas con Zod al arrancar); nunca `process.env` suelto ni secretos hardcodeados o commiteados.
9. Logs con `utils/logger.js` (no `console.*` directo). Nunca loguear datos sensibles: contraseñas, hashes, tokens, el body de auth ni los `parameters` de un error SQL (se loguea solo el stack).
10. Operaciones que modifican varios recursos a la vez (incluido reordenar) → transacción.

### Documentación, módulos y migraciones

11. Docs: módulo nuevo → crear su doc; módulo editado → actualizar la suya. Nunca código sin doc reflejado. Formato del repo: `docs/api/*.md` (backend, endpoints, modelo de datos, seguridad), `docs/pasos/paso-NN.md` y `api/docs/openapi.yaml` para cada endpoint.
12. Módulo nuevo → mismo patrón que uno existente: `validators/x.validator.js`, `repositories/x.repository.js`, `services/x.service.js`, `controllers/x.controller.js` y `routes/x.routes.js` montado en `routes/index.js`. Acceso con `authenticate` + `authorize(rol)` + middlewares de dueño o inscripción.
13. Si un cambio toca roles, permisos o reglas de acceso → revisar y actualizar `docs/api/seguridad.md`.
14. Migraciones siempre con sequelize-cli (`.cjs` en `api/db/migrations/`). Nunca SQL a mano contra la BD ni editar una migración ya aplicada: se agrega una nueva.
15. Agentes IA: nunca aplicar migraciones (`npm run migrate`, ni un `docker compose up` que corra migraciones nuevas) sin confirmación explícita del usuario en el chat: escribir el archivo, mostrarlo y esperar. Antes de correrlas, verificar contra qué base apuntan (`DB_HOST`, `POSTGRES_DB`).
16. Tests de integración/e2e: no crearlos, actualizarlos ni ejecutarlos durante el desarrollo salvo pedido explícito; se hacen al final, con el proyecto completo.

### Contratos y consultas

17. POST, PUT y PATCH devuelven el objeto completo actualizado (el cliente evita el refetch).
18. Update con todos los campos opcionales: el esquema Zod exige al menos uno (422 `VALIDATION_ERROR`, coherente con la regla 5) antes de ejecutar el update; nunca un update con body vacío.
19. Sin N+1: nada de queries dentro de loops; usar `include` o consultas por lote (`where: { id: ids }` → `IN`).
20. Seleccionar solo las columnas que el endpoint devuelve: `attributes: [...]` explícito en los repositorios y `returning: [...]` en create/update; nunca `SELECT *`. Con `attributes` explícito no aplica el `exclude` del `defaultScope`: el repositorio decide.
21. Índices en FKs y en columnas de filtro u orden, siempre vía migración (regla 15 para aplicarla). En Postgres las FKs no se indexan solas y un índice compuesto solo sirve para filtrar por su primera columna.
22. Columnas de fecha o de filtro usadas en rangos llevan índice; proponerlo cuando un endpoint filtra por rango.

### Optimización

23. Partes costosas opcionales detrás de un parámetro de query; el default conserva el comportamiento existente y el cliente pide solo lo que muestra.
24. Totales y agregados que se pueden derivar de datos ya consultados (suma de los grupos) se calculan en memoria, sin otra consulta.
25. Paneles y gráficos: agregar en la BD (`GROUP BY`, `COUNT`, `AVG` con `sequelize.fn`); nunca devolver filas crudas para que el cliente sume. Filtros opcionales como condiciones o subconsultas, sin unir tablas en todas las agrupaciones; las condiciones comunes van en una función compartida.
26. Listados que no se paginan (temario, preguntas, tablas de registros): tope duro con `limit + 1` y flag `truncated`, o un máximo de negocio validado al crear; datos relacionados con una consulta por lote, nunca una por fila.
27. Reducir consultas antes que paralelizar: dentro de una transacción van en serie por la misma conexión (`Promise.all` no acelera); fuera de ella, paralelizar solo las independientes. Sin consultas redundantes (p. ej. `authenticate` no consulta la BD: el JWT ya trae `{ id, rol }`).
28. Autorrevisión antes de entregar: pasar las reglas 4–5, 19–22 y 23–27 contra lo escrito y corregir antes de presentarlo; el usuario no debería tener que pedir optimizaciones después del primer resultado.

## C. Frontend (`web/`)

1. Mejores prácticas siempre.
2. Reutilización; componentes modulares.
3. No hacer ni sugerir verificaciones visuales (las hace el usuario).
4. Contratos explícitos: el proyecto es JS, así que props, servicios y hooks se documentan con JSDoc (`@typedef`, `@param`, `@returns`); `jsconfig.json` tiene `checkJs` activo. Sin objetos "bolsa" sin forma definida.
5. Componentes chicos, responsabilidad única; lógica repetida → abstracción (hook/servicio/util).
6. Respetar nomenclatura/estructura existente (ver §2.1 del plan): `api/`, `services/`, `context/`, `hooks/`, `routes/`, `components/ui|layout|errors|icons`, `pages/public|student|instructor`, `utils/`. Imports con alias `@/`.
7. A11y: HTML semántico, `alt`, labels, ARIA si aplica.
8. Sin estilos inline; solo clases Tailwind con los tokens de `src/index.css` (`bg-primary`, `text-fg-muted`, `border-border`…). Nada de colores hex sueltos en componentes (excepciones: 36).
9. Sin logs de debug, código comentado ni dead code.
10. Responsive mobile-first; todo debe funcionar a 375 px.
11. Nada de `alert`/`confirm`/`prompt`: toasts con `useToast` (`ToastProvider` + `components/ui/Toaster`, ya implementados) y `ConfirmDialog`/`Modal` propios en `components/ui/` (pendientes: crearlos una sola vez en el primer paso que los necesite).
12. Nada de `type="date"`/`datetime-local`: selector de fecha propio si hiciera falta.
13. Componentes con variantes (botones, badges, tabs, pills…): una implementación con prop `variant`/`size`; no duplicar.
14. Requests mínimos por acción. Prohibido "ejecutar → recargarTodo". Acción chica (tildar, editar campo, reordenar): actualizar solo ese recurso (respuesta del POST/PATCH o refetch de ese endpoint). Recarga total solo si cambian varios recursos.
15. Toggles/checks frecuentes: update optimista + rollback + toast si falla; no bloquear la UI esperando refetch.
16. Antes de sumar una acción con recarga global: contar requests; >2-3 para un cambio puntual → recarga parcial.
17. Catálogos/datos poco cambiantes (categorías, niveles): cargar una vez y cachear; refetch solo al entrar a la pantalla o a pedido.
18. Búsqueda/filtro por texto: debounce ~300 ms.
19. Cancelar requests obsoletos (`AbortController` → `signal` de axios) al desmontar o cambiar filtro.
20. Requests independientes en paralelo (`Promise.all`), nunca `await` en cascada.
21. Key estable y única en listas (id, no índice).
22. Imports puntuales (tree-shaking); no importar librerías enteras por una función/ícono. Íconos: SVG propios en `components/icons/`.
23. Páginas con `React.lazy` (code splitting); `loading="lazy"` en imágenes fuera del primer viewport.
24. Toda promesa con manejo de error; mostrarlo con toast o con el estado de error de la vista (`ErrorMessage`).
25. Tablas/listados: sin scroll horizontal en móvil; cada fila → card reutilizable (encabezados como etiquetas). Controles de ancho fijo en filtros: wrap y 100 % de ancho en móvil.
26. Implementación grande (módulo, flujo, varias pantallas): dudas de alcance/flujo/diseño/datos → preguntar todo en una sola ronda antes; no suponer nada importante. Plan aprobado → ejecutar de punta a punta.
27. Pantalla con secciones independientes: cada una se muestra al responder (estado + skeleton por sección); nunca bloquear todo con una promesa agregada; si una falla muestra su error sin tumbar las demás.
28. Dedupe: compartir la petición en curso (mapa de promesas por función+params) ante doble montaje (StrictMode). No cachear resultados salvo catálogos (17).
29. Pedir solo lo visible: datos de pestaña/vista/modal al abrirla, no al montar.
30. Deps de efectos estables: ids o claves serializadas, nunca objetos/arrays recreados por render o colecciones del contexto de sesión.
31. Al cambiar filtros: descartar la respuesta anterior (cancelación + clave vigente); no mostrar datos del filtro viejo mientras carga el nuevo.
32. Paneles/gráficos: un endpoint agregado (no sumar listados crudos en cliente); gráficos livianos propios (barras con Tailwind); alternativa accesible (tabla/aria). Totales derivados de datos ya cargados.
33. Botones: siempre `components/ui/Button` (o `LinkButton`). Ya trae hover, active (`scale-[0.97]`) y loading (spinner, `disabled`, `aria-busy`, mismo ancho, sin doble envío). Si `onClick` devuelve una promesa, el loading es automático; en formularios usar `loading={isSubmitting}`.
34. Errores inesperados: manejador global único ya implementado (`components/errors/`): `ErrorBoundary` en la raíz, `errorElement` en el router y `GlobalErrorListener` (`error`/`unhandledrejection`). Aviso en 2 niveles (mensaje + Copiar/Recargar y detalle técnico con `requestId`, fecha, usuario, pantalla, stack). Al iniciar sesión, llamar `setErrorReportUser(user)` (`utils/errorReport.js`). Errores esperados (validación, 4xx de negocio) van con toast/estado; nunca tragar errores ni mostrar stack fuera del detalle. Sin `;`: una línea que empieza con `(`, `[` o backtick se une a la anterior (ASI) → asignar a variable.
35. Autorrevisión antes de entregar: chequear 14–20, 27–32, 33, 34 y 39 contra lo escrito y corregir.
36. Animaciones solo funcionales y cortas (120–300 ms): entrada de página, modales, desplegables, toasts, ítem activo. Nada decorativo en bucle, sin brillos/glow. Se hacen con las animaciones de `src/index.css` (tokens `--animate-*`) y variantes `motion-reduce:`; `prefers-reduced-motion` ya está cubierto globalmente. Únicas excepciones a inline: posiciones calculadas en runtime (tooltips/popovers), como vars CSS (`--x`, `--y`) consumidas por clases.
37. Desplegables/selects: diseño propio, nunca nativo (`<select>`/`<option>`/`<datalist>`). Una implementación (`components/ui/Select`) con variantes por prop, teclado (flechas, Inicio/Fin, Enter/Espacio, Esc, búsqueda por tipeo), ARIA combobox/listbox, cierre por clic afuera/Esc/blur (`hooks/useDismiss`), lista en portal que abre hacia arriba si no entra.
38. Scroll fluido en listas largas con scroll propio: scroller con fondo opaco; hover off durante scroll (`data-desplazando` vía DOM, sin state); header sticky al `thead` entero; listeners de scroll pasivos, sin setState por evento.
39. Validación de inputs: un único hook `hooks/useAppForm` sobre React Hook Form, con reglas de `utils/validation.js`: valida al salir (blur), nunca mientras se escribe; un campo con error se revalida al escribir solo para limpiarlo; el submit valida todo y enfoca el primer inválido. Errores de la API: `submit(fn)` los aplica solo (o `setApiErrors(error)`): por campo si traen `details`, si no en `formError`; los 5xx van al manejador global. El campo (`components/ui/Input`) muestra el error debajo con `aria-invalid` + `aria-describedby`.
40. Ver detalle / editar desde un listado: en registros simples (p. ej. una pregunta de un cuestionario) abrir un modal sobre el listado, sin cambiar de vista; el listado queda detrás con sus filtros y página. El modal tiene URL propia (ruta hija `…/:id` que renderiza el mismo listado + el modal; el listado pone `<Outlet />`) para compartir o recargar; cerrar vuelve a la pantalla anterior (o al listado si se entró directo). Lo que tiene flujo propio o el plan define como página (detalle de curso del catálogo, editor de curso, editor de lección, vista de lección, panel) sigue como página. Contenido del modal lazy y pedido al abrirlo (29). Un solo componente compartido (`components/ui/Modal`, ver 11), no por pantalla.
