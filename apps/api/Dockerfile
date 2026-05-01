# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@10.33.0

# Copiar manifiestos del workspace primero (layer cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/db/package.json        packages/db/
COPY packages/env/package.json       packages/env/
COPY packages/shared/package.json    packages/shared/
COPY apps/api/package.json           apps/api/

RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY packages/ packages/
COPY apps/api/ apps/api/

# Generar Prisma client y compilar paquetes internos + API
RUN pnpm --filter @colacero/db run generate
RUN pnpm --filter @colacero/env run build
RUN pnpm --filter @colacero/db run build
RUN pnpm --filter @colacero/api run build

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist   ./dist
COPY --from=builder /app/node_modules    ./node_modules
# Copiamos packages/ completo — pnpm resuelve los workspace packages
# como symlinks dentro de node_modules que apuntan aquí
COPY --from=builder /app/packages        ./packages

EXPOSE 3000

CMD ["node", "dist/index.js"]
