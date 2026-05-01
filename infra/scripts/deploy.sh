#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# deploy.sh — Deploy manual en el VPS
# Se corre EN EL SERVIDOR, no en local.
#
# Uso:
#   ssh user@VPS "cd /opt/colacero && bash infra/scripts/deploy.sh"
# ══════════════════════════════════════════════════════════════
set -euo pipefail

APP_DIR="/opt/colacero"
COMPOSE="docker compose -f $APP_DIR/infra/docker-compose.prod.yml"

echo "[$(date '+%H:%M:%S')] → Iniciando deploy..."

cd "$APP_DIR"

# 1. Traer última versión
echo "[$(date '+%H:%M:%S')] → git pull..."
git pull origin master

# 2. Rebuild + restart (solo los servicios que cambiaron)
echo "[$(date '+%H:%M:%S')] → docker compose up --build..."
$COMPOSE up -d --build

# 3. Esperar a que la API esté lista
echo "[$(date '+%H:%M:%S')] → Esperando API..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo "[$(date '+%H:%M:%S')] → API lista ✓"
    break
  fi
  sleep 3
done

# 4. Limpiar imágenes viejas
echo "[$(date '+%H:%M:%S')] → Limpiando imágenes antiguas..."
docker image prune -f

echo "[$(date '+%H:%M:%S')] ✅ Deploy completado"
