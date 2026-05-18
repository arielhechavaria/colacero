# ColaCero — Estado del proyecto

> **Última actualización:** 2026-05-18 (después de Fases 1-4: seed enriquecido, super-admin, email verification, landing pública)

---

## TL;DR

**MVP funcional y desplegado.** Listo para acompañar 3-5 negocios cubanos a mano. Signup público cerrado por decisión (no listo para escala automática).

| Capa | Estado |
|------|--------|
| Infra (DNS, HTTPS, Docker, Postgres, Redis, BullMQ) | ✅ |
| API (auth hardened, productos, órdenes, stats, admin) | ✅ |
| Catálogo público multi-tenant por subdominio | ✅ |
| Panel del dueño (dashboard, kanban, productos, clientes, settings) | ✅ |
| Panel super-admin (gestión de negocios) | ✅ |
| Auth: cookies httpOnly, refresh tokens, CSRF, rate limit, password reset, email verification | ✅ |
| Landing pública en `colacero.com/` | ✅ |
| Signup público self-service | ❌ deshabilitado a propósito |
| Email verification obligatoria | ❌ modo soft (banner) |
| Pagos online | ❌ pickup-and-pay |
| WhatsApp provider real | ❌ mock (Telegram funciona) |

---

## URLs en producción

| URL | Qué es | Cómo se accede |
|-----|--------|----------------|
| https://colacero.com/ | Landing pública | Cualquiera |
| https://el-fogon.colacero.com/ | Catálogo del primer cliente (demo) | Cualquiera |
| https://panel.colacero.com/ | Panel del dueño | Login owner/staff |
| https://panel.colacero.com/admin/businesses | Super-admin dashboard | Solo SUPER_ADMIN |
| https://api.colacero.com/ | API REST | Programático |
| https://api.colacero.com/health | Health check | Cualquiera |
| https://api.colacero.com/docs | Swagger UI | Cualquiera (modo dev) |

---

## Credenciales actuales en producción

| Usuario | Password | Rol | Notas |
|---------|----------|-----|-------|
| `admin@colacero.com` | `AdminPass2026!` | SUPER_ADMIN | Para gestión de plataforma |
| `ariel@elfogon.cu` | *(la que pisamos manual)* | OWNER | Dueño de `el-fogon` |

**Acción pendiente:** cambiar la contraseña de `admin@colacero.com` desde el panel (`/settings`) o vía SQL.

---

## Stack técnico

**Monorepo TypeScript con Turborepo + pnpm workspaces.**

```
apps/
├── api/          # Fastify v5 + Prisma + BullMQ + Redis (puerto 3000)
├── catalog/      # Next.js 15 — catálogo público multi-tenant (puerto 3001)
└── panel/        # Next.js 15 — panel del dueño + super-admin (puerto 3002)

packages/
├── db/           # Prisma client + migrations + seed
├── env/          # Zod env schema
└── shared/       # Tipos compartidos + slug-blocklist
```

**Infra prod (VPS 178.104.183.249):**
- Cloudflare DNS + HTTPS termination
- nginx host-level (wildcard `*.colacero.com` → catalog, `panel.colacero.com` → panel, `api.colacero.com` → api)
- Docker Compose (postgres-16, redis-7, api, catalog, panel)
- CI/CD vía GitHub Actions → GHCR → SSH deploy

---

## Datos en producción (post-Fase 1)

| Entidad | Cantidad | Notas |
|---------|----------|-------|
| Business | 1 | `el-fogon` (limpiamos duplicado `elfogon` viejo) |
| Products | 18 | 6 categorías: Carnes, Granos, Lácteos, Frutas, Vegetales, Almacén |
| Customers | 11 | 8 del seed + 3 de pruebas históricas |
| Orders | 133 | Distribuidas en 45 días, mix de estados, co-purchases armados |
| Pickup Windows | 94 | 45 días pasados + hoy + mañana, 2 ventanas/día (10-12, 15-17) |
| Users | 2 | OWNER (`ariel@elfogon.cu`) + SUPER_ADMIN (`admin@colacero.com`) |

**Stock alert intencional:** Huevos con 4 unidades (threshold 30) para que el dashboard muestre alerta.

**Co-purchases armados:**
- Arroz + Frijoles negros (~25)
- Pollo + Aceite (~20)
- Pan + Huevos (~15)
- Tomate + Cebolla (~10)
- Mango + Plátano (~8)

---

## Features completas (qué se puede demo)

### Para clientes finales (en el catálogo)
- Explorar productos por categoría (toolbar de filtros, búsqueda, orden)
- Ver fotos de productos (fallback automático a Unsplash por nombre)
- Agregar al carrito con reserva de stock (5 min)
- Remover items individuales del carrito
- Sync de stock al abrir drawer (warnings si cambió)
- Checkout con notas opcionales al pedido
- Auth via Telegram Mini App (HMAC validation) o OTP fallback
- Track de pedido con código de recogida (polling 30s)
- Estado en vivo: CONFIRMED → PREPARING → READY → PICKED_UP

### Para el dueño (en el panel)
- Login con email/password (cookies httpOnly + CSRF + refresh rotation)
- Password reset por email (link vía Resend o consola dev)
- Email verification (banner soft, no obligatorio)
- Dashboard analytics: KPIs, top productos, co-compras, weekly trends, stock alerts
- Pedidos kanban (filtro por fecha + futuro hasta 30 días)
- Cola de preparación (vista priorizada)
- Productos: CRUD completo + filtros + orden + bulk upload de imagen
- Inventario con optimistic locking (no overselling)
- Ventanas de recogida (CRUD + generate-tomorrow auto)
- CRM clientes: lista con segmentos, búsqueda, detalle, historial de pedidos
- Anuncios broadcast (Telegram channel)
- Settings: perfil del negocio, staff, cambio de contraseña

### Para el super-admin (en `/admin`)
- Lista de todos los negocios con stats (productos, órdenes, ingresos, última orden)
- Búsqueda por slug o nombre
- Suspender / reactivar un negocio (afecta inmediatamente al catálogo público)
- Detalle de un negocio con users asociados

---

## Roadmap pendiente (post-MVP)

Ver `docs/USER_MANUAL.md` para el manual operativo. Lo que falta del plan original:

### Decisiones cacheadas (no se implementan hasta...)

| Pendiente | Trigger para activar |
|-----------|----------------------|
| Re-abrir signup público | Cuando tengamos 3-5 clientes a mano funcionando bien |
| Onboarding wizard automático | Si el alta manual revela fricciones repetitivas |
| Pagos online | Cuando un cliente real lo pida |
| WhatsApp provider real | Si un cliente sin Telegram lo necesita |
| Email verification obligatoria | Si vemos signups spam o de baja calidad |
| Multi-business per user | Cuando alguien pida gestionar 2+ negocios |
| Tests E2E con Playwright | Antes de cualquier release público grande |

### Próximo bloque sugerido

1. **Conseguir 3-5 clientes reales** — el techo del producto no se mueve sin esto.
2. Configurar `RESEND_API_KEY` en prod cuando haya cuentas reales (hoy emails caen en consola, OK para validar).
3. Configurar tokens de Telegram (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_NOTIFY_CHAT_ID`) para notificaciones reales.
4. Una vez con tracción: re-abrir signup público + onboarding wizard.

---

## Variables de entorno críticas (en VPS)

Ubicación: `/opt/colacero/.env`

```
DATABASE_URL=postgresql://colacero:PASS@postgres:5432/colacero_prod
REDIS_URL=redis://redis:6379
JWT_SECRET=...           # 128-hex random
COOKIE_SECRET=...        # 128-hex random
PANEL_URL=https://panel.colacero.com
API_PUBLIC_URL=https://api.colacero.com
CORS_ORIGIN=https://panel.colacero.com,https://colacero.com,https://*.colacero.com

# Opcionales — si están vacíos, fallback a consola
RESEND_API_KEY=
FROM_EMAIL=noreply@colacero.com
TELEGRAM_BOT_TOKEN=
TELEGRAM_NOTIFY_CHAT_ID=
TELEGRAM_CHANNEL_ID=
```

---

## Migrations aplicadas en prod

| Nombre | Fecha | Qué hace |
|--------|-------|----------|
| `20260427054209_init` | 2026-04-28 | Schema inicial |
| `20260502000000_customer_telegram_auth` | 2026-05-03 | Telegram auth + OTP |
| `20260508000000_add_category_to_product` | 2026-05-09 | Categorías en productos |
| `20260510043150_add_refresh_tokens` | 2026-05-10 | Auth hardening Phase 2 |
| `20260511000000_add_password_reset_tokens` | 2026-05-11 | Password reset |
| `20260511000001_onboarding_schema` | 2026-05-18 | BusinessStatus + SUPER_ADMIN + email global unique |
| `20260511000002_email_verification` | 2026-05-18 | Email verification soft |

---

## Salud actual

**Lo que funciona y se ha verificado:**
- Login owner via panel.colacero.com → cookies se setean → redirect a /orders ✅
- Login super-admin → ve link "Admin" en sidebar → accede a /admin/businesses ✅
- Catálogo en el-fogon.colacero.com carga con productos + fotos Unsplash ✅
- Suspender negocio desde admin → catálogo devuelve 404 inmediatamente ✅
- Password reset link funciona end-to-end (modo consola) ✅
- Email verification banner aparece para users no verificados ✅
- Landing colacero.com renderiza con hero + features + CTA ✅

**Cosas que conviene mirar después:**
- Tests CI siguen rojos por pre-existing issues con env vars en runner (no bloquea deploy)
- WhatsApp y Telegram en mode mock (decisión correcta para MVP)
- 11 customers incluye 3 de testing histórico (no es bug, no estorba)
