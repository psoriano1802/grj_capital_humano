# AGENTS.md

Este repositorio es un sistema de Recursos Humanos full-stack (backend Node/Express + TypeScript + PostgreSQL, frontend React 18/Vite). Varios documentos (`README.md`, `COMMANDS.md`) son anteriores a los módulos más recientes y están desactualizados — trata el código como la fuente de verdad.

## Orden de comandos de desarrollo

```bash
npm install
npm run dev            # backend (nodemon+ts-node) + frontend (Vite) en paralelo
npm run server:dev     # solo backend, puerto 3000
npm run client:dev     # solo frontend, puerto 5173
npm run db:migrate     # aplica el esquema de BD (ts-node src/server/database/migrate.ts)
npm run build          # tsc -p tsconfig.server.json && vite build
```

- **No hay framework de tests ni script de lint/typecheck**. La validación es manual (UI + curl contra `http://localhost:3000`).
- El build usa dos proyectos TS: el servidor se compila con `tsconfig.server.json`; el frontend con Vite. El proxy de dev del cliente envía `/api` al backend en el 3000.
- `npm run db:migrate` ejecuta `src/server/database/migrate.ts`, que aplica los archivos SQL en `database/` (incluido `database/organizacion.sql` y `database/seguridad.sql`). También se puede aplicar manualmente: `psql -p <puerto> -U postgres -d rh_management -f database/<archivo>.sql`.

## Área de trabajo activa: Módulo de Organización

Este módulo es el enfoque actual y **no** está descrito en `README.md`/`COMMANDS.md`.

- Rutas backend: `src/server/routes/organizacion.ts`, montadas en `/api/organizacion` en `src/server/index.ts`.
- Frontend: `src/client/components/Organizacion.tsx` (+ `Organizacion.css`). Módulo basado en pestañas con vistas: `resumen`, `sucursales`, `departamentos`, `puestos`, `centros-costo`, **`organigrama`**, `ubicaciones`.
- Tablas de entidades (camelCase, deben citarse exactamente en SQL): `sucursales`, `departamentos`, `puestos`, `niveles_puesto`, `centros_costo`, `organigrama`, `ubicaciones_fisicas`.
- Convención de API: cada handler devuelve `{ success, data, message? }`; en error `{ success:false, error }`. Las llamadas del frontend pasan por `apiFetch('/...')` que antepone `BASE='/api/organizacion'`.

### Particularidades del Organigrama (relevantes para la tarea de "gráfica en ramas")

- `GET /api/organizacion/organigrama` devuelve **filas planas** (cada una con `puesto_id`, `puesto_jefe_id`, `nivel_jerarquico`, `es_jefe_directo`, más los campos unidos `puesto_nombre`, `jefe_nombre`, `departamento_nombre`). Filtra `WHERE o.vigente=TRUE`.
- El árbol se construye en el **frontend** en `OrganigramaView` -> `buildTree()` (`Organizacion.tsx`), agrupando las filas por `puesto_jefe_id` en `children`. El renderizado actual es una **lista vertical anidada** (clases CSS `org-tree-root` / `org-tree-node` / `org-tree-card` / `org-tree-children`), no un layout gráfico de ramas/árbol. El trabajo en la visualización gráfica de "ramas" vive en `OrganigramaView`/`TreeNode` + `Organizacion.css`.
- `organigrama` en backend soporta GET + POST + PUT + DELETE (baja lógica `vigente=FALSE`). POST y PUT verifican **ciclos jerárquicos** (`hasCycle` en `organizacion.ts`) y rechazan con `400` si el nuevo jefe ya depende del puesto subordinado.

## Módulo de Seguridad (Perfiles / Accesos / Usuarios)

Implementado sobre la identidad basada en empleados (no usa auth JWT). Restringe el menú lateral según los accesos del **usuario activo** de `SessionContext`.

- Módulo frontend `src/client/components/Configuracion.tsx`, accesible en el menú **Seguridad** (solo para quien tenga el acceso `seguridad`; los perfiles con `es_administrador=TRUE` ven todo).
- Tablas en `database/seguridad.sql`: `perfiles`, `accesos`, `perfil_accesos`; más columnas `empleados.perfil_id` (FK a `perfiles`) y `empleados.estatus_usuario` (`activo` | `inactivo` | `temporalmente_inactivo`, VARCHAR(30)).
- Rutas backend (montadas en `src/server/index.ts`):
  - `/api/perfiles` — GET/POST/PUT/DELETE + `GET /:id/accesos` (devuelve todos los accesos con `asignacion_id` nullable) y `PUT /:id/accesos` (body `{ acceso_ids: number[] }`, reemplaza el conjunto).
  - `/api/accesos` — CRUD de móduLos/procesos. `DELETE` falla si el acceso está asignado a algún perfil.
  - `/api/seguridad` — `GET/PUT /usuarios`, `GET /usuarios/:id/accesos` (para filtrar el menú devuelve `{ estatus_usuario, perfil_id, es_administrador, accesos:[...] }`).
- En `SessionContext.tsx`: cada usuario activo expone `accessKeys`, `estatusUsuario`, `perfilAdmin`, `hasAccess`. `Sidebar` recibe `allowedKeys` para ocultar secciones. La identidad activa se persiste en `localStorage` (`rh_current_user`).
- Semántica de estatus de usuario en `AppContent` (`App.tsx`): `inactivo` = pantalla "sin acceso"; `temporalmente_inactivo` = banner informativo pero permite operar.
- `GET /api/empleados` ahora incluye `perfil_id`, `perfil_clave`, `perfil_nombre`, `perfil_admin`, `estatus_usuario` (LEFT JOIN perfiles).
- Seeds idempotentes: 4 perfiles (ADMIN/RH/SUPERVISOR/EMPLEADO) y 29 accesos registrados desde el menú; empleados seed con perfil asignado (EMP002→ADMIN, EMP004→RH, EMP005→SUPERVISOR, EMP001/EMP003→EMPLEADO).

## Notas de entorno de base de datos

- La app lee los ajustes de PostgreSQL de las variables de entorno en `.env`, con respaldo a los valores por defecto en `src/server/database/connection.ts` (`DB_HOST`=localhost, `DB_PORT`=5432, `DB_NAME`=rh_management, `DB_USER`=postgres).
- Si el entorno ya define `DB_PORT`, ese valor gana sobre `.env` al arrancar.
- El servicio `app` de `docker-compose.yml` fija `DB_HOST=db`, `DB_PORT=5432`, por lo que una app en Docker se conecta al contenedor (5432), no al Postgres local (5433).
- Dev local sin Docker: `DB_HOST=localhost`, `DB_PORT=5433` si tu Postgres local escucha en 5433. `psql -p 5433 -U postgres -d rh_management`.
- Para depurar problemas de conexión: comprueba si el proceso en ejecución es Node local o docker-compose, qué `DB_HOST`/`DB_PORT` hay en ese runtime y en qué puerto escucha realmente Postgres. Configuración completa: `DATABASE_SETUP.md`, `QUICKSTART.md`.