# Colacero — Agent Skills Index

Antes de trabajar en cualquier tarea, verificá si hay un skill relevante y cargalo.

## Cómo usar

1. Revisá la columna **Trigger** para encontrar skills que apliquen a tu tarea
2. El agente lee el `SKILL.md` en la ruta indicada
3. Aplicá TODOS los patrones del skill cargado
4. Pueden aplicar múltiples skills simultáneamente

---

## Skills del proyecto

| Skill | Trigger | Path |
|-------|---------|------|
| `colacero-vps` | Deploy, VPS, Docker, producción, SSH, logs, .env, containers | [`~/.claude/skills/colacero-vps/SKILL.md`](~/.claude/skills/colacero-vps/SKILL.md) |

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
- **API Dockerfile:** usa `node:20-slim` con `apt-get install -y openssl` para Prisma
- **pnpm version:** `10.33.0` — fijado en todos los Dockerfiles
