# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@10.33.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/db/package.json        packages/db/
COPY packages/env/package.json       packages/env/
COPY packages/shared/package.json    packages/shared/
COPY apps/catalog/package.json       apps/catalog/

RUN pnpm install --frozen-lockfile

COPY packages/ packages/
COPY apps/catalog/ apps/catalog/

# Asegurar que el directorio public exista (Next.js lo requiere al copiar)
RUN mkdir -p /app/apps/catalog/public

# Build paquetes internos que catalog usa (env principalmente)
RUN pnpm --filter @colacero/env run build

# Build Next.js en modo standalone
RUN pnpm --filter @colacero/catalog run build

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Next.js standalone incluye todo lo necesario
COPY --from=builder /app/apps/catalog/.next/standalone        ./
COPY --from=builder /app/apps/catalog/.next/static      ./apps/catalog/.next/static
COPY --from=builder /app/apps/catalog/public            ./apps/catalog/public

EXPOSE 3001

CMD ["node", "apps/catalog/server.js"]
