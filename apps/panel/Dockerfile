# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@10.33.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/db/package.json        packages/db/
COPY packages/env/package.json       packages/env/
COPY packages/shared/package.json    packages/shared/
COPY apps/panel/package.json         apps/panel/

RUN pnpm install --frozen-lockfile

COPY packages/ packages/
COPY apps/panel/ apps/panel/

RUN pnpm --filter @colacero/env run build

# Build Next.js en modo standalone
RUN pnpm --filter @colacero/panel run build

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002

COPY --from=builder /app/apps/panel/.next/standalone  ./
COPY --from=builder /app/apps/panel/.next/static      ./.next/static
COPY --from=builder /app/apps/panel/public            ./public 2>/dev/null || true

EXPOSE 3002

CMD ["node", "server.js"]
