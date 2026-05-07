FROM node:20-slim
WORKDIR /app

# OpenSSL requerido por Prisma para detectar la plataforma correcta (debian-openssl-3.0.x)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

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
COPY apps/api/public apps/api/public

# Generar Prisma client y compilar paquetes internos + API
RUN pnpm --filter @colacero/db run generate
RUN pnpm --filter @colacero/env run build
RUN pnpm --filter @colacero/db run build
RUN pnpm --filter @colacero/api run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]
