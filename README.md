# ColaCero 🚀

Sistema de pedidos y recogida sin cola para negocios cubanos.

## Quickstart

```bash
# Levantar infraestructura (PostgreSQL + Redis)
pnpm infra:up

# Instalar dependencias
pnpm install

# Generar cliente Prisma
pnpm db:generate

# Aplicar migraciones
pnpm db:migrate

# Poblar datos de prueba
pnpm db:seed

# Iniciar todos los servicios en modo desarrollo
pnpm dev
```

## Estructura del monorepo

```
colacero/
├── apps/
│   └── api/          # Fastify 4 REST API (@colacero/api)
├── packages/
│   ├── env/          # Validación de variables de entorno con Zod (@colacero/env)
│   ├── shared/       # Tipos TypeScript compartidos (@colacero/shared)
│   └── db/           # Prisma client + schema (@colacero/db)
├── infra/
│   └── docker-compose.yml
└── docs/
    └── adr/          # Architecture Decision Records
```

## Stack

| Capa | Tecnología |
|------|------------|
| Runtime | Node.js 20 |
| API | Fastify 4 + TypeScript |
| ORM | Prisma 5 + PostgreSQL 16 |
| Cache | Redis 7 |
| Build | Turborepo v2 + pnpm workspaces |
| Tests | Vitest |
| Infra | Docker Compose (dev), Hetzner VPS (prod) |

## Variables de entorno requeridas

Copia `.env.example` a `.env` y rellena los valores:

```
DATABASE_URL=postgresql://colacero:colacero@localhost:5432/colacero_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=<mínimo 32 caracteres>
```

Consulta `packages/env/src/schema.ts` para la lista completa.
