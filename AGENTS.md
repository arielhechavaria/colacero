# Colacero — Agent Skills Index

Antes de trabajar en cualquier tarea, verificá si hay un skill relevante y cargalo.

> **Definición completa de agentes por sprint** → ver [`../AGENTES.md`](../AGENTES.md)

---

## Cómo usar

1. Revisá la columna **Trigger** para encontrar skills que apliquen a tu tarea
2. Leé el `SKILL.md` en la ruta indicada antes de escribir código
3. Aplicá TODOS los patrones del skill cargado
4. Pueden aplicar múltiples skills simultáneamente

---

## Skills del proyecto

| Skill | Trigger | Path |
|-------|---------|------|
| `cuba-review` | Antes de abrir cualquier PR — code review final | [`../skills/cuba-review/SKILL.md`](../skills/cuba-review/SKILL.md) |
| `notion-tasks` | Leer/mover tareas en Notion, actualizar estados de sprint | [`../skills/notion-tasks/SKILL.md`](../skills/notion-tasks/SKILL.md) |
| `api-route` | Crear o modificar endpoints en Fastify | [`../skills/api-route/SKILL.md`](../skills/api-route/SKILL.md) |
| `migration` | Crear o modificar migraciones de Prisma | [`../skills/migration/SKILL.md`](../skills/migration/SKILL.md) |
| `vue-component` | Crear componentes Vue 3 en el panel admin | [`../skills/vue-component/SKILL.md`](../skills/vue-component/SKILL.md) |

## Skills globales (usuario)

| Skill | Trigger | Path |
|-------|---------|------|
| `colacero-vps` | Deploy, VPS, Docker, producción, SSH, logs, containers | [`~/.claude/skills/colacero-vps/SKILL.md`](~/.claude/skills/colacero-vps/SKILL.md) |
| `skill-creator` | Crear nuevos skills de agente | [`~/.claude/skills/skill-creator/SKILL.md`](~/.claude/skills/skill-creator/SKILL.md) |

---

## Agentes por sprint

Ver [`../AGENTES.md`](../AGENTES.md) para los prompts completos de cada agente.

| Agente | Sprint | Responsabilidad |
|--------|--------|-----------------|
| `infra-agent` | 1A | Monorepo, DB, Auth, CI |
| `catalog-agent` | 1B-1C | Catálogo Next.js + API de órdenes |
| `panel-agent` | 2A-2B | Panel Vue 3 + PWA + tiempo real |
| `whatsapp-agent` | 3A | Integración WhatsApp Cloud API + BullMQ |
| `qa-agent` | 3B | k6, Playwright E2E, Lighthouse CI |

---

## Infraestructura de producción

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| API (Fastify) | 3000 | Backend REST + WebSocket |
| Catalog (Next.js) | 3001 | Catálogo público de productos |
| Panel (Next.js) | 3002 | Panel de administración |
| PostgreSQL | interno | Base de datos principal |
| Redis | interno | Colas BullMQ + sesiones OTP |

**VPS:** Hetzner — `178.104.183.249`  
**Stack:** pnpm workspaces + Turborepo + Docker Compose  
**Deploy:** `infra/docker-compose.prod.yml` desde `/opt/colacero`  
**Script:** `infra/scripts/deploy.sh`

---

## Workspace packages

| Package | Descripción |
|---------|-------------|
| `@colacero/api` | Fastify API — `apps/api/` |
| `@colacero/catalog` | Next.js catálogo — `apps/catalog/` |
| `@colacero/panel` | Next.js panel admin — `apps/panel/` |
| `@colacero/db` | Prisma client + schema — `packages/db/` |
| `@colacero/env` | Validación de env vars (zod) — `packages/env/` |
| `@colacero/shared` | Tipos y utils compartidos — `packages/shared/` |

---

## Convenciones críticas

- **Build order:** `@colacero/env` → `@colacero/db` → app
- **DATABASE_URL:** el host DEBE ser `postgres` (servicio Docker), nunca `localhost`
- **Prisma binaryTarget:** `debian-openssl-3.0.x` para `node:20-slim`
- **Next.js:** `output: 'standalone'` en catalog y panel para Docker
- **API Dockerfile:** usa `node:20-slim` con `apt-get install -y openssl` antes de pnpm install
- **pnpm version:** `10.33.0` — fijado en todos los Dockerfiles
- **Git workflow:** rama por tarea → PR → squash merge. Ver `../AGENTES.md` sección "Git Workflow"
- **Commits:** Conventional Commits — `feat`, `fix`, `test`, `chore`, `refactor`, `docs`
