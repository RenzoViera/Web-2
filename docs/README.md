# Documentación de MiniAula

| Documento | Contenido |
|---|---|
| [arquitectura.md](arquitectura.md) | Monorepo, stack, decisiones técnicas y desviaciones justificadas |
| [api/backend.md](api/backend.md) | Cómo está construida la API: configuración, capas, errores, validación, paginación, logs, Swagger |
| [api/endpoints.md](api/endpoints.md) | Todos los endpoints del proyecto con su estado (implementado / pendiente y en qué paso) |
| [api/modelo-datos.md](api/modelo-datos.md) | Tablas, columnas, índices, asociaciones, scopes, datos de prueba y diferencias con el plan |
| [api/seguridad.md](api/seguridad.md) | Autenticación, autorización, matriz de acceso e invariantes de seguridad |
| [web/frontend.md](web/frontend.md) | Cómo está construida la SPA: estructura, sesión, rutas protegidas, formularios, toasts, componentes, errores globales, router |
| [docker.md](docker.md) | Servicios de Docker Compose y cómo correr el proyecto con o sin Docker |
| [pasos/paso-01.md](pasos/paso-01.md) | Registro del paso 01: qué se hizo, cómo probarlo y notas para el siguiente paso |
| [pasos/paso-02.md](pasos/paso-02.md) | Registro del paso 02: modelo de datos, migraciones, seed y Docker completo |
| [pasos/paso-03.md](pasos/paso-03.md) | Registro del paso 03: autenticación (API + Web), correcciones por las reglas y notas para el paso 04 |
| [pasos/paso-04.md](pasos/paso-04.md) | Registro del paso 04: cursos del instructor y catálogo base (API + Web) |
| [pasos/paso-05.md](pasos/paso-05.md) | Registro del paso 05: lecciones y preguntas del instructor |
| [pasos/paso-06.md](pasos/paso-06.md) | Registro del paso 06: catálogo, detalle, inscripción y Mis cursos |

Reglas de desarrollo: [../REGLAS.md](../REGLAS.md). Documentación interactiva de la API: `http://localhost:3000/api/docs`.

> Convención: cada paso agrega su archivo en `docs/pasos/`, actualiza el estado de sus endpoints en
> `api/endpoints.md` y amplía la sección correspondiente de `backend.md` / `frontend.md`.
