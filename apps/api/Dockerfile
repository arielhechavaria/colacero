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

# Deployment aislado: workspace deps copiados como paquetes reales, sin symlinks
RUN pnpm --filter @colacero/api deploy --prod /deploy
# prisma generate no corre en pnpm deploy → copiar cliente generado manualmente
RUN cp -r /app/node_modules/.prisma /deploy/node_modules/.prisma

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# node_modules viene del deployment aislado: @colacero/* resueltos sin symlinks
COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist   ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
