# ColaCero

Sistema de pedidos anticipados con retiro en local. Los clientes navegan el catálogo, eligen productos y horario de retiro; el negocio gestiona todo desde el panel de administración.

## Stack

| Capa | Tecnología |
|------|------------|
| Runtime | Node.js 20 |
| API | Fastify 4 + TypeScript |
| ORM | Prisma 5 + PostgreSQL 16 |
| Cache | Redis 7 + BullMQ |
| Frontend | Next.js 14 (App Router) |
| Build | Turborepo v2 + pnpm workspaces |
| Tests | Vitest |
| Infra | Docker Compose · Hetzner VPS · GHCR |

## Servicios

| App | Puerto | Descripción |
|-----|--------|-------------|
| `api` | 3000 | Fastify REST API |
| `catalog` | 3001 | Catálogo público (Next.js) |
| `panel` | 3002 | Panel de administración (Next.js) |
| PostgreSQL | interno | — |
| Redis | interno | — |

## Desarrollo local

```bash
# Requisitos: Node 20, pnpm 10.33.0, Docker

pnpm install
pnpm infra:up        # levanta postgres + redis
pnpm db:generate     # genera el cliente Prisma
pnpm db:migrate      # aplica migraciones
pnpm db:seed         # carga datos de prueba
pnpm dev             # levanta las 3 apps en paralelo
```

Variables de entorno: copiá `.env.example` a `.env` y completá los valores.
El host de PostgreSQL en local es `localhost`; en producción es `postgres` (servicio Docker).

## Producción

### CI/CD automático (GitHub Actions + GHCR)

Cada push a `master` dispara el pipeline `.github/workflows/deploy.yml`:

```
git push origin master
       │
       ▼
  GitHub Actions
  ┌─────────────────────────────────────────┐
  │  Build (paralelo, ~5-8 min)             │
  │  ├── colacero-api:latest   → GHCR       │
  │  ├── colacero-catalog:latest → GHCR     │
  │  └── colacero-panel:latest → GHCR       │
  └─────────────────────────────────────────┘
       │
       ▼
  Deploy (SSH al VPS)
  docker compose pull → up -d → image prune
```

El VPS **nunca buildea** — solo descarga imágenes pre-construidas desde GHCR.

### Secrets requeridos en GitHub

Repo → Settings → Secrets and variables → Actions:

| Secret | Valor |
|--------|-------|
| `VPS_HOST` | IP del servidor |
| `VPS_USER` | Usuario SSH (`root`) |
| `VPS_SSH_KEY` | Clave privada ed25519 |

### Setup inicial del VPS (una sola vez)

```bash
git clone https://github.com/arielhechavaria/colacero.git /opt/colacero
cd /opt/colacero
cp .env.prod.example .env
# Editar .env con los valores reales

docker compose -f infra/docker-compose.prod.yml pull
docker compose -f infra/docker-compose.prod.yml up -d

# Migraciones
docker compose -f infra/docker-compose.prod.yml exec api \
  npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

### Deploy manual (sin CI)

```bash
cd /opt/colacero
docker compose -f infra/docker-compose.prod.yml pull
docker compose -f infra/docker-compose.prod.yml up -d
docker image prune -f
```

## Estructura del monorepo

```
apps/
  api/        Fastify API (@colacero/api)
  catalog/    Next.js catálogo público (@colacero/catalog)
  panel/      Next.js panel admin (@colacero/panel)
packages/
  db/         Prisma client + schema (@colacero/db)
  env/        Validación de env vars con Zod (@colacero/env)
  shared/     Tipos y utils compartidos (@colacero/shared)
infra/
  docker-compose.prod.yml   Stack de producción
  nginx/                    Config nginx (pendiente dominio + SSL)
.github/
  workflows/deploy.yml      Pipeline CI/CD
```

## Imágenes Docker (GHCR)

```
ghcr.io/arielhechavaria/colacero-api:latest
ghcr.io/arielhechavaria/colacero-catalog:latest
ghcr.io/arielhechavaria/colacero-panel:latest
```
