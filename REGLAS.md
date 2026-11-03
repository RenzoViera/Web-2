# REGLAS.md — Reglas de desarrollo de MiniAula

> Reglas obligatorias para los integrantes y para cualquier agente IA (Claude, Codex, Copilot…).
> Complementan el plan de pasos (`AGENTS.md`, local de cada integrante). Ante conflicto, manda este archivo en
> lo que respecta a **cómo** se escribe el código; el plan manda en **qué** se hace en cada paso.
> La numeración del frontend es fija (hay referencias cruzadas): no renumerar, solo agregar al final.

---

## A. Generales

- Stack, estructura y convenciones fijas: Express 5 + JS ESM, Sequelize + PostgreSQL 16, Zod, React + Vite + Tailwind v4, React Router 8 (`react-router`), Context API, axios, React Hook Form. No agregar librerías sin anotarlo en las notas del paso.
- Conventional Commits (`feat(api): …`, `feat(web): …`, `fix(…)`, `chore(docker): …`, `docs: …`), commits pequeños, todo entra a `main` por PR.
- Nunca commitear `.env` ni secretos. Nunca hardcodear URLs (`VITE_API_URL`) ni credenciales.
- Sin `console.log` de debug, código comentado ni dead code.
- Nombres de dominio en español (`curso`, `leccion`, `inscripcion`), código técnico en inglés (`service`, `repository`, `validate`).
- Archivos: componentes y páginas `PascalCase.jsx`; hooks `useXxx.js`; servicios `xxxService.js` (web) / `xxx.service.js` (api).

## B. Backend (`api/`)

1. Capas: `routes` → `middlewares` → `controllers` (req → service → res, **sin lógica ni queries**) → `services` (reglas RN-xx) → `repositories` (únicos que tocan modelos).
2. Toda entrada pasa por `validate({ body, params, query })` con esquemas de `validators/`. Reusar `validators/common.validator.js` (`idParamSchema`, `paginationQuerySchema`).
3. Todo error se lanza con `throw new AppError(status, ERROR_CODES.X, mensaje, details)`. Express 5 propaga errores async: no usar `try/catch` solo para hacer `next(err)`.
4. Formato de error único `{ error: { code, message, details } }`; cada respuesta lleva header `X-Request-Id` (también en logs).
5. Validación: body inválido → 422; query/params inválidos o JSON mal formado → 400; unique de BD → 409.
6. Listados: `getPagination(query)` + `buildPaginatedResponse(rows, count, pagination)` → `{ data, meta }`.
7. Nunca devolver `passwordHash` ni `indiceCorrecto` (salvo editor del instructor dueño). `toPublicPregunta()` es el único sanitizador.
8. Variables de entorno solo vía `config/env.js` (validadas con Zod al arrancar); nunca `process.env` suelto en el código.
9. Logs con `utils/logger.js` (no `console.*` directo).
10. Operaciones multi-tabla o de reordenamiento → transacción.

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
11. Nada de `alert`/`confirm`/`prompt`: toasts (`useToast`) y `ConfirmDialog`/`Modal` propios en `components/ui/` — pendientes: crearlos una sola vez en el primer paso que los necesite.
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
39. Validación de inputs: un único hook `hooks/useAppForm` sobre React Hook Form (pendiente, paso 03): valida al salir (blur), nunca mientras se escribe; un campo con error se revalida al escribir solo para limpiarlo; el submit valida todo y enfoca el primer inválido. Errores de la API → `setApiErrors(error)`. El campo (`components/ui/Input`) muestra el error debajo con `aria-invalid` + `aria-describedby`.
