# Documentación de MiniAula

| Documento | Contenido |
|---|---|
| [arquitectura.md](arquitectura.md) | Monorepo, stack, decisiones técnicas y desviaciones justificadas |
| [api/backend.md](api/backend.md) | Cómo está construida la API: configuración, capas, errores, validación, paginación, logs, Swagger |
| [api/endpoints.md](api/endpoints.md) | Todos los endpoints del proyecto con su estado (implementado / pendiente y en qué paso) |
| [web/frontend.md](web/frontend.md) | Cómo está construida la SPA: estructura, tokens de diseño, componentes, errores globales, router |
| [docker.md](docker.md) | Servicios de Docker Compose y cómo correr el proyecto con o sin Docker |
| [pasos/paso-01.md](pasos/paso-01.md) | Registro del paso 01: qué se hizo, cómo probarlo y notas para el siguiente paso |

Reglas de desarrollo: [../REGLAS.md](../REGLAS.md). Documentación interactiva de la API: `http://localhost:3000/api/docs`.

> Convención: cada paso agrega su archivo en `docs/pasos/`, actualiza el estado de sus endpoints en
> `api/endpoints.md` y amplía la sección correspondiente de `backend.md` / `frontend.md`.
