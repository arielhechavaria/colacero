# ColaCero — Estado del proyecto

> **Última actualización:** 2026-05-19 — post pulido visual + docs online + lead capture

---

## TL;DR

**MVP listo para pitch a clientes.** Producto deployado, documentación online en HTML profesional (no README), formulario de captura de leads activo, super-admin operativo.

| Capa | Estado |
|------|--------|
| Infra (DNS, HTTPS, Docker, Postgres, Redis, BullMQ) | ✅ |
| API completa (auth, productos, órdenes, stats, admin, leads) | ✅ |
| Catálogo público multi-tenant por subdominio | ✅ |
| Hero del negocio en catálogo (estado abierto/cerrado, próxima ventana) | ✅ |
| Panel del dueño (dashboard con saludo, kanban, productos, clientes, settings) | ✅ |
| Panel super-admin (negocios + leads) | ✅ |
| Auth: cookies httpOnly, refresh tokens, CSRF, rate limit, password reset, email verification | ✅ |
| Landing pública en `colacero.com/` | ✅ |
| Manual online (`/manual` con 7 secciones) | ✅ |
| Páginas marketing (`/precios`, `/faq`, `/about`, `/contacto`) | ✅ |
| Lead capture (form + DB + admin view) | ✅ |
| Empty states + skeleton loaders en todo el panel | ✅ |
| Signup público self-service | ❌ deshabilitado a propósito |
| Email verification obligatoria | ❌ modo soft (banner) |
| Pagos online | ❌ pickup-and-pay |
| WhatsApp provider real | ❌ mock (Telegram funciona) |
| OG image dinámica (preview al compartir) | ⏳ pendiente (PNG estático) |

---

## URLs en producción

### Públicas (para clientes y prospectos)

| URL | Qué es |
|-----|--------|
| https://colacero.com/ | **Landing pública** con hero, features, lead form, CTA Telegram |
| https://colacero.com/manual | Manual de usuario completo con sidebar (7 secciones) |
| https://colacero.com/precios | Pricing (gratis durante beta) |
| https://colacero.com/faq | Preguntas frecuentes con accordion |
| https://colacero.com/about | Nosotros + founder card |
| https://colacero.com/contacto | Form de captura + Telegram directo |
| https://el-fogon.colacero.com/ | Catálogo demo del primer cliente |

### Privadas (con login)

| URL | Acceso |
|-----|--------|
| https://panel.colacero.com/login | Login del dueño |
| https://panel.colacero.com/dashboard | Dashboard con saludo personalizado |
| https://panel.colacero.com/orders | Kanban de pedidos |
| https://panel.colacero.com/admin/businesses | Super-admin: gestión de negocios |
| https://panel.colacero.com/admin/leads | Super-admin: gestión de leads (CRM) |

### API

| URL | Notas |
|-----|-------|
| https://api.colacero.com/health | Health check |
| https://api.colacero.com/docs | Swagger UI |
| `POST /api/leads` | Endpoint público para captura desde landing |
| `POST /api/auth/owner/login` | Login dueño |
| Resto: ver Swagger | |

---

## Credenciales actuales en producción

| Usuario | Password | Rol | Notas |
|---------|----------|-----|-------|
| `admin@colacero.com` | `AdminPass2026!` | SUPER_ADMIN | Cambiala apenas puedas |
| `ariel@elfogon.cu` | *(pisada manual previa)* | OWNER | Dueño del demo `el-fogon` |

---

## Datos en producción (negocio demo)

| Entidad | Cantidad |
|---------|----------|
| Business | 1 (`el-fogon`) |
| Products | 18 en 6 categorías |
| Customers | 11 |
| Orders | 133 (45 días, mix de estados, co-purchases armados) |
| Pickup Windows | 94 |
| Users | 2 (OWNER + SUPER_ADMIN) |
| Leads | 0+ (se llena cuando alguien usa el form) |

**Stock alert intencional:** Huevos con 4 unidades (threshold 30).

**Co-purchases armados** (para que `/dashboard` muestre análisis):
- Arroz + Frijoles negros (~25 órdenes)
- Pollo + Aceite (~20)
- Pan + Huevos (~15)
- Tomate + Cebolla (~10)
- Mango + Plátano (~8)

---

## Stack técnico

**Monorepo TypeScript con Turborepo + pnpm workspaces.**

```
apps/
├── api/          # Fastify v5 + Prisma + BullMQ + Redis (puerto 3000)
├── catalog/      # Next.js 15 — catálogo público + landing + docs (puerto 3001)
└── panel/        # Next.js 15 — panel dueño + super-admin (puerto 3002)

packages/
├── db/           # Prisma client + migrations + seed
├── env/          # Zod env schema
└── shared/       # Tipos + slug-blocklist + validators
```

**Infra prod (VPS 178.104.183.249):**
- Cloudflare DNS (apex + wildcard) + HTTPS termination
- nginx host-level (wildcard → catalog, panel/api hosts dedicados)
- Docker Compose (postgres-16, redis-7, api, catalog, panel)
- CI/CD: GitHub Actions → GHCR → SSH deploy en master push
- Workflow: develop branch para WIP, merge `develop → master` dispara deploy

---

## Migrations aplicadas en prod

| Nombre | Qué hace |
|--------|----------|
| `20260427054209_init` | Schema inicial |
| `20260502000000_customer_telegram_auth` | Telegram auth + OTP |
| `20260508000000_add_category_to_product` | Categorías en productos |
| `20260510043150_add_refresh_tokens` | Auth hardening Phase 2 |
| `20260511000000_add_password_reset_tokens` | Password reset |
| `20260511000001_onboarding_schema` | BusinessStatus + SUPER_ADMIN + email global unique |
| `20260511000002_email_verification` | Email verification soft |
| `20260518000000_leads` | Tabla Lead + LeadStatus enum |

---

## Variables de entorno críticas (`/opt/colacero/.env`)

```bash
# DB
DATABASE_URL=postgresql://colacero:PASS@postgres:5432/colacero_prod
REDIS_URL=redis://redis:6379

# Auth (CRÍTICOS)
JWT_SECRET=...           # 128-hex random
COOKIE_SECRET=...        # 128-hex random

# URLs
PANEL_URL=https://panel.colacero.com
API_PUBLIC_URL=https://api.colacero.com
CORS_ORIGIN=https://panel.colacero.com,https://colacero.com,https://*.colacero.com
NEXT_PUBLIC_CONTACT_URL=https://t.me/Arielhechavarria

# Opcionales (fallback a console mode si vacíos)
RESEND_API_KEY=
FROM_EMAIL=noreply@colacero.com
TELEGRAM_BOT_TOKEN=
TELEGRAM_NOTIFY_CHAT_ID=
TELEGRAM_CHANNEL_ID=
```

---

## Lo que se ENTREGÓ en la sesión "pre-pitch polish" (último bloque)

### Bloque 1 — Pulido visual
- Hero del negocio en catálogo: badge "Abierto ahora/Cerrado · abre X", próxima ventana con countdown
- Open Graph + Twitter Cards + favicons SVG en catalog y panel
- Empty states reusables + skeleton loaders en `windows`, `queue`, `customers`
- Welcome al login: redirect a `/dashboard` con saludo "Buenas tardes, {nombre}. Hoy tenés N pedidos en curso"
- Telegram link corregido (`@Arielhechavarria`)
- 404 page con personalidad (gradient hero + CTAs)

### Bloque 2 — Manual online
- 7 páginas de manual en `/manual/*` con sidebar TOC + breadcrumb + prev/next nav
- Componentes reusables: H1/H2/H3, Note (info/tip/warning), ScreenshotPlaceholder, PrevNext
- Páginas de marketing: `/precios`, `/faq`, `/about`, `/contacto`
- MarketingShell compartido (header con nav + footer con links)

### Bloque 3 — Lead capture
- Tabla `Lead` + enum `LeadStatus` (NEW, CONTACTED, TRIAL, CONVERTED, LOST)
- `POST /api/leads` público con rate limit 5/hora por IP
- `<LeadForm />` en landing (lateral del CTA) y en `/contacto`
- `/admin/leads` con filtros por status, cambio de estado, notas

---

## Lo que falta para "100% pre-pitch perfecto"

| Item | Impacto | Esfuerzo |
|------|---------|----------|
| OG image PNG estático (compartir link bonito) | Alto | 30min — crear PNG 1200x630 con Figma/Canva |
| Logo personal del negocio editable | Medio | 1h — upload + storage en `business.logoUrl` |
| Screenshots reales en el manual | Medio | 1h — capturar las pantallas y subir |
| Testimonio de el-fogon en landing | Alto | espera primer feedback real |
| Demo video Loom embedded | Muy alto | tenés que grabarlo vos (60-90 seg) |
| Sound + badge cuando entra orden nueva | Medio | 1.5h — Service Worker + Audio API |
| QR del catálogo en panel | Medio | 30min — generar SVG QR descargable |
| Print/export ticket de orden | Bajo | 1h — ventana print con CSS @print |

---

## Lo que se DECIDIÓ NO hacer (por scope)

- ~~Re-abrir signup público~~ — espera 3-5 clientes reales primero
- ~~Onboarding wizard automático~~ — alta a mano es OK durante beta
- ~~Pagos online~~ — pickup-and-pay funciona en Cuba
- ~~WhatsApp real~~ — Telegram cubre 100% por ahora
- ~~Tests E2E (Playwright)~~ — manual smoke OK por ahora
- ~~Backups automáticos~~ — pendiente, importante post-pitch
- ~~Helmet/audit log/soft delete~~ — quality-of-life, post-pitch

---

## Acciones pendientes (lo único que NO está deployado)

| Acción | Quién | Detalle |
|--------|-------|---------|
| Cambiar password de `admin@colacero.com` | Vos | Desde `/settings` en el panel |
| Activar Resend (emails reales) | Vos | `RESEND_API_KEY=re_xxx` en `.env` del VPS |
| Configurar Telegram bot real | Vos | `TELEGRAM_BOT_TOKEN` + `TELEGRAM_NOTIFY_CHAT_ID` |
| Crear PNG estático para OG image | Vos | 1200x630, subir a `apps/catalog/public/og-image.png` y referenciar en metadata |
| Grabar demo video de 60-90 seg | Vos | Loom o screenshare, embebes en landing |

---

## Salud verificada end-to-end (post-deploy)

```
✅ https://colacero.com/                     → 200 (landing + lead form)
✅ https://colacero.com/manual               → 200 (manual con sidebar)
✅ https://colacero.com/precios              → 200
✅ https://colacero.com/faq                  → 200
✅ https://colacero.com/about                → 200
✅ https://colacero.com/contacto             → 200
✅ https://el-fogon.colacero.com/            → 200 (con hero del negocio)
✅ https://panel.colacero.com/login          → 200
✅ POST https://api.colacero.com/api/leads   → 200 {"ok":true}
✅ Admin login + listar leads                → funciona
✅ Admin login + listar businesses           → funciona
```

---

## Para empezar a vender — checklist práctico

1. **Cambiá la password de admin** en `/settings` (5 min)
2. **Compartí el link `colacero.com`** por Telegram a 3-5 contactos potenciales
3. **Andá viendo `/admin/leads`** — los que respondan al form aparecen ahí
4. **Para cada lead "TRIAL":** dales de alta manual con SQL (instrucciones en `docs/USER_MANUAL.md`)
5. **Documentá tu primer testimonio** apenas el-fogon o el primer cliente tenga feedback positivo

El producto está listo. Lo que falta es **conseguir los primeros 3-5 negocios**.
