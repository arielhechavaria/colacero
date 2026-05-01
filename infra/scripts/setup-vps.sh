#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# setup-vps.sh — Configuración inicial del servidor (correr UNA sola vez)
# Probado en Ubuntu 22.04 LTS (Hetzner CX22 o similar)
#
# Uso:
#   ssh root@IP_DEL_VPS
#   curl -sL https://raw.githubusercontent.com/TU_USER/colacero/master/infra/scripts/setup-vps.sh | bash
#
# O bien manualmente paso a paso.
# ══════════════════════════════════════════════════════════════
set -euo pipefail

REPO_URL="https://github.com/arielhechavaria/colacero.git"
APP_DIR="/opt/colacero"
DOMAIN="${DOMAIN:-tudominio.com}"

echo "════════════════════════════════════"
echo "  ColaCero — Setup VPS"
echo "  Dominio: $DOMAIN"
echo "════════════════════════════════════"

# ── 1. Actualizar sistema ────────────────────────────────────────────────────
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Instalar Docker ──────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "→ Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
else
  echo "→ Docker ya instalado: $(docker --version)"
fi

# ── 3. Instalar Docker Compose plugin ───────────────────────────────────────
if ! docker compose version &>/dev/null; then
  echo "→ Instalando Docker Compose plugin..."
  apt-get install -y docker-compose-plugin
fi

# ── 4. Clonar repositorio ───────────────────────────────────────────────────
if [ ! -d "$APP_DIR" ]; then
  echo "→ Clonando repositorio en $APP_DIR..."
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "→ Repositorio ya existe en $APP_DIR"
fi

cd "$APP_DIR"

# ── 5. Configurar .env ──────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  echo "→ Copiando .env.prod.example → .env"
  cp .env.prod.example .env
  echo ""
  echo "⚠️  IMPORTANTE: Editar el archivo .env con los valores reales:"
  echo "   nano $APP_DIR/.env"
  echo ""
  echo "   Variables críticas a cambiar:"
  echo "   - POSTGRES_PASSWORD"
  echo "   - JWT_SECRET (openssl rand -hex 32)"
  echo "   - TELEGRAM_BOT_TOKEN"
  echo "   - TELEGRAM_CHANNEL_ID"
  echo "   - API_PUBLIC_URL → https://$DOMAIN"
  echo "   - API_HOSTNAME   → $DOMAIN"
else
  echo "→ .env ya existe, no se sobrescribe"
fi

# ── 6. Actualizar nginx.conf con el dominio ──────────────────────────────────
echo "→ Actualizando nginx.conf con dominio $DOMAIN..."
sed -i "s/tudominio\.com/$DOMAIN/g" infra/nginx/nginx.conf

# ── 7. Obtener certificado SSL (Let's Encrypt) ───────────────────────────────
echo ""
echo "→ Para obtener el certificado SSL, ejecutar DESPUÉS de que DNS apunte al VPS:"
echo ""
echo "   docker run --rm -v /opt/colacero/infra/certbot_certs:/etc/letsencrypt \\"
echo "     -v /opt/colacero/infra/certbot_www:/var/www/certbot \\"
echo "     certbot/certbot certonly --webroot \\"
echo "     -w /var/www/certbot \\"
echo "     -d $DOMAIN -d www.$DOMAIN -d panel.$DOMAIN \\"
echo "     --email tu@email.com --agree-tos --non-interactive"
echo ""

# ── 8. Levantar el stack ─────────────────────────────────────────────────────
echo "→ Para levantar el sistema (tras configurar .env y SSL):"
echo ""
echo "   cd $APP_DIR"
echo "   docker compose -f infra/docker-compose.prod.yml up -d --build"
echo ""
echo "═══════════════════════════════════════"
echo "  Setup completo. Pasos siguientes:"
echo "  1. Editar $APP_DIR/.env"
echo "  2. Apuntar DNS al VPS"
echo "  3. Obtener certificado SSL (comando arriba)"
echo "  4. docker compose -f infra/docker-compose.prod.yml up -d --build"
echo "═══════════════════════════════════════"
