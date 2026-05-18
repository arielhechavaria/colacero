# ColaCero — Manual de usuario

> Cómo usar la plataforma, día a día y cuando algo falla.

---

## Tabla de contenidos

1. [Para el dueño de un negocio](#para-el-dueño-de-un-negocio)
2. [Para tus clientes (catálogo)](#para-tus-clientes-catálogo)
3. [Para el super-admin (Ariel)](#para-el-super-admin-ariel)
4. [Tareas operativas frecuentes](#tareas-operativas-frecuentes)
5. [Resolución de problemas](#resolución-de-problemas)

---

## Para el dueño de un negocio

### 1. Acceder al panel

URL: **https://panel.colacero.com**

Iniciá sesión con el email y la contraseña que te dimos al crear tu negocio.

Si olvidás la contraseña: click en **"¿Olvidaste tu contraseña?"** en la pantalla de login. Vas a recibir un email con un link para restablecer (válido 60 minutos).

### 2. Verificar tu email

Después del primer login vas a ver un banner amarillo arriba pidiéndote verificar tu email.

- Click en **"Reenviar email"**
- Buscá el email en tu casilla (puede tardar 1-2 min)
- Click en el link → email queda verificado, banner desaparece

> 📝 **Nota:** No estás obligado a verificar tu email para usar el panel. Pero te recomendamos hacerlo para recuperar tu cuenta si perdés acceso.

### 3. Cargar tus productos

En el panel: **Productos → +Nuevo producto**

Campos obligatorios:
- **Nombre** — ej. "Pollo entero"
- **Precio unitario** — en CUP, ej. 350
- **Unidad** — elegí de la lista (libra, kg, unidad, etc.) o "Otro" para texto libre
- **Stock inicial** — opcional, podés cargarlo después

Campos opcionales:
- **SKU** — código interno único (ej. POLLO-01)
- **Categoría** — agrupa productos en el catálogo (Carnes, Granos, etc.)
- **Descripción** — texto breve
- **Imagen** — subí una foto. Si no, el catálogo elige una de Unsplash según el nombre.

### 4. Configurar ventanas de recogida

En el panel: **Ventanas**

Una ventana es un horario en el que tus clientes pueden venir a recoger. Ejemplos:
- Sábado 10:00-12:00, capacidad 10 pedidos
- Sábado 15:00-17:00, capacidad 10 pedidos

Botón **"Generar mañana"** crea automáticamente las ventanas del día siguiente con los horarios usados en los últimos días.

### 5. Atender pedidos

Cuando entra un pedido, lo ves en **Pedidos** organizado por fecha y ventana.

Los estados van así:

```
CONFIRMED  →  PREPARING  →  READY  →  PICKED_UP
              (vos lo movés)
```

- **CONFIRMED**: el cliente confirmó la orden. Generalmente automático tras el checkout.
- **PREPARING**: vos estás preparando el pedido. Movelo cuando empezás.
- **READY**: el pedido está listo para recoger. El cliente recibe un código de 6 caracteres.
- **PICKED_UP**: el cliente vino y se lo llevó. Cerrás la orden.

Si un cliente cancela o no aparece: cambiá el status a **CANCELLED**.

### 6. Cambiar tu negocio o ajustes

En el panel: **Configuración** (o "Config." en mobile)

- **Negocio**: nombre, descripción, zona horaria
- **Staff**: agregar/quitar usuarios que también accedan al panel
- **Seguridad**: cambiar tu contraseña

### 7. Ver analytics

En el panel: **Dashboard**

Selector de período arriba: hoy, ayer, últimos 7 días, etc.

- **KPIs**: ingresos, pedidos, entregados, ticket promedio
- **Top productos**: ranking de lo más vendido
- **Co-compras**: qué productos se compran juntos
- **Weekly trends**: gráfico de barras de los últimos 7 días
- **Stock alerts**: productos con poco stock

Tip: los pedidos cancelados NO suman al ingreso ni a "entregados", pero sí aparecen en el conteo total.

### 8. Anuncios

En el panel: **Anuncios**

Mandá un mensaje a tu canal de Telegram (cuando esté configurado).

> 📝 Hoy en producción Telegram está en modo mock — los anuncios se loguean pero no se envían. Activar requiere que el operador (Ariel) configure el bot token.

---

## Para tus clientes (catálogo)

### 1. Acceder al catálogo de un negocio

URL: **https://[slug-del-negocio].colacero.com**

Ej.: https://el-fogon.colacero.com

### 2. Explorar productos

- **Filtros por categoría**: click en los chips arriba ("Carnes", "Lácteos", etc.)
- **Búsqueda**: por nombre del producto
- **Orden**: por nombre, precio o stock

Cada card muestra: foto, nombre, precio, unidad y stock disponible.

### 3. Agregar al carrito

Click en el botón **"+"** de cada producto. El stock se **reserva 5 minutos**: si no completás el checkout en ese tiempo, vuelve a quedar disponible.

Botón **FAB flotante** (circulito abajo a la derecha) abre el carrito.

En el carrito podés:
- Ver lo agregado
- Cambiar cantidades
- Remover items individualmente (botón ✕)
- Ir al checkout

### 4. Hacer un pedido (checkout)

Si abrís el catálogo desde **Telegram (Mini App)**, ya estás logueado automáticamente (HMAC validation con tu user de Telegram).

Si entrás desde el browser, usás OTP por SMS como fallback.

En el checkout:
1. Elegís la **ventana de recogida** disponible
2. Opcional: agregás **notas** para el negocio (alergias, instrucciones especiales)
3. Confirmás

Recibís un **código de 6 caracteres** (ej. `KX7P2M`). Mostralo cuando vas a recoger.

### 5. Seguir tu pedido

URL: **https://[slug].colacero.com/track/[código]**

La página se refresca cada 30 segundos. Muestra el estado en vivo:
- `CONFIRMED` — el negocio ya lo vio
- `PREPARING` — están armándolo
- `READY` — ya podés pasar a buscarlo
- `PICKED_UP` — orden cerrada

---

## Para el super-admin (Ariel)

### Login

URL: **https://panel.colacero.com/login**

- Email: `admin@colacero.com`
- Password: `AdminPass2026!` (cambiala en `/settings` apenas puedas)

### Acceder al admin

En el sidebar vas a ver un link **"👑 Admin"** (solo aparece para SUPER_ADMIN).

URL directa: **https://panel.colacero.com/admin/businesses**

### Gestionar negocios

La tabla muestra todos los negocios con:
- Nombre + link al catálogo
- Status (Activo / Pendiente / Suspendido)
- Cantidad de productos
- Cantidad de órdenes
- Ingresos totales (suma de PICKED_UP)
- Fecha de última orden
- Fecha de creación

### Suspender / reactivar

Click en el botón rojo **"Suspender"** o verde **"Reactivar"** en la fila correspondiente. Te pide confirmación.

Cuando un negocio queda en **SUSPENDED**:
- Su catálogo público (`slug.colacero.com`) devuelve 404 inmediatamente
- Sus owners siguen pudiendo entrar al panel
- Las órdenes existentes no se cancelan

### Crear un nuevo negocio (alta manual)

Hoy NO hay self-service signup. Para crear un negocio nuevo:

```sql
-- Conectarse a postgres:
ssh root@178.104.183.249 "docker exec -it infra-postgres-1 psql -U colacero -d colacero_prod"

-- Generar hash de password con argon2:
ssh root@178.104.183.249 "docker exec infra-api-1 node -e \"const{hash}=require('/app/node_modules/.pnpm/@node-rs+argon2@1.8.3/node_modules/@node-rs/argon2');hash('LaPasswordDelCliente').then(h=>console.log(h))\""

-- Crear business + user en una transacción:
BEGIN;
INSERT INTO "Business" (id, slug, name, description, timezone, status)
VALUES (gen_random_uuid()::text, 'nombre-del-negocio', 'Nombre Real', 'Descripción corta', 'America/Havana', 'ACTIVE');

INSERT INTO "User" (id, "businessId", email, "passwordHash", role, "emailVerifiedAt", "createdAt")
VALUES (
  gen_random_uuid()::text,
  (SELECT id FROM "Business" WHERE slug = 'nombre-del-negocio'),
  'dueno@email.com',
  '$argon2id$...',  -- el hash generado arriba
  'OWNER',
  NOW(),  -- grandfathereamos como ya verificado
  NOW()
);
COMMIT;
```

Después el cliente puede entrar a https://panel.colacero.com con esa email + password.

---

## Tareas operativas frecuentes

### Conectarse al VPS

```bash
ssh root@178.104.183.249
```

Dir base: `/opt/colacero`. Docker compose: `infra/docker-compose.prod.yml`.

### Ver logs

```bash
docker logs infra-api-1 --tail 100
docker logs infra-panel-1 --tail 100
docker logs infra-catalog-1 --tail 100
```

### Ver estado de contenedores

```bash
docker compose -f /opt/colacero/infra/docker-compose.prod.yml ps
```

### Conectarse a la DB

```bash
docker exec -it infra-postgres-1 psql -U colacero -d colacero_prod
```

Consultas útiles:

```sql
-- Resumen general
SELECT
  (SELECT COUNT(*) FROM "Business") AS businesses,
  (SELECT COUNT(*) FROM "User")     AS users,
  (SELECT COUNT(*) FROM "Customer") AS customers,
  (SELECT COUNT(*) FROM "Order")    AS orders;

-- Negocios y sus owners
SELECT b.slug, b.status, u.email, u.role
FROM "Business" b LEFT JOIN "User" u ON u."businessId" = b.id
ORDER BY b.slug, u.role;

-- Últimas 10 órdenes
SELECT pickup_code, status, subtotal, "createdAt"
FROM "Order"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Stock bajo
SELECT p.name, i."quantityAvailable", i."lowStockThreshold"
FROM "Product" p JOIN "Inventory" i ON i."productId" = p.id
WHERE i."quantityAvailable" <= i."lowStockThreshold";
```

### Re-correr el seed (cuidado, borra órdenes/ventanas)

```bash
docker exec infra-api-1 sh -c "cd /app && tsx packages/db/prisma/seed.ts"
```

Esto:
- Preserva la business `el-fogon`
- Borra todas sus órdenes y ventanas
- Upserts los 18 productos del seed
- Upserts los 8 customers
- Crea 45 días de ventanas
- Genera ~133 órdenes históricas + 6 órdenes activas para hoy

### Deploy de código

El deploy es automático:
1. Push a `develop` → CI corre lint+typecheck (puede fallar tests por env vars del runner)
2. Merge `develop → master` (fast-forward)
3. Push a `master` → Deploy job builda imágenes GHCR + SSH deploy al VPS

```bash
# Workflow
git checkout develop
# ... hacer cambios ...
git add -A && git commit -m "feat: ..."
git push origin develop

# Promover a prod
git checkout master
git merge develop --ff-only
git push origin master
git checkout develop
```

Esperá ~3-4 minutos. Verifica con `gh run list --limit 2`.

### Aplicar una migration de Prisma en prod

**Método A (recomendado para cambios chicos):** SQL directo

```bash
# 1. Escribir SQL en un archivo temporal local
# 2. Copiar al VPS:
scp /tmp/migration.sql root@178.104.183.249:/tmp/migration.sql
ssh root@178.104.183.249 "docker cp /tmp/migration.sql infra-postgres-1:/tmp/migration.sql && docker exec infra-postgres-1 psql -U colacero -d colacero_prod -f /tmp/migration.sql"

# 3. Registrar en _prisma_migrations (clave para no re-aplicar):
ssh root@178.104.183.249 "docker exec infra-postgres-1 psql -U colacero -d colacero_prod -c \"
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (gen_random_uuid()::text, 'manual', NOW(), 'YYYYMMDDhhmmss_nombre', NULL, NULL, NOW(), 1);
\""
```

**Método B (cuando hay nueva imagen API con la migration adentro):**

```bash
ssh root@178.104.183.249 "docker exec infra-api-1 /app/packages/db/node_modules/.bin/prisma migrate deploy --schema /app/packages/db/prisma/schema.prisma"
```

### Rebuild local de un container (si CI/CD no llega)

```bash
ssh root@178.104.183.249 "cd /opt/colacero && docker compose -f infra/docker-compose.prod.yml up -d --build api"
```

### Cambiar password de un usuario

```bash
# 1. Generar hash:
HASH=$(ssh root@178.104.183.249 "docker exec infra-api-1 node -e \"const{hash}=require('/app/node_modules/.pnpm/@node-rs+argon2@1.8.3/node_modules/@node-rs/argon2');hash('NuevaPassword').then(h=>console.log(h))\"")

# 2. Update (via archivo SQL para evitar interpolación de $ en argon2id):
echo "UPDATE \"User\" SET \"passwordHash\" = '$HASH' WHERE email = 'usuario@dominio.com';" > /tmp/pwd.sql
scp /tmp/pwd.sql root@178.104.183.249:/tmp/
ssh root@178.104.183.249 "docker cp /tmp/pwd.sql infra-postgres-1:/tmp/pwd.sql && docker exec infra-postgres-1 psql -U colacero -d colacero_prod -f /tmp/pwd.sql"
```

### Activar emails reales (Resend)

1. Crear cuenta en https://resend.com
2. Verificar dominio `colacero.com` (agregar DNS records SPF + DKIM en Cloudflare)
3. Generar API key
4. En el VPS:
   ```bash
   ssh root@178.104.183.249 "echo 'RESEND_API_KEY=re_xxx' >> /opt/colacero/.env && echo 'FROM_EMAIL=noreply@colacero.com' >> /opt/colacero/.env"
   ssh root@178.104.183.249 "docker compose -f /opt/colacero/infra/docker-compose.prod.yml restart api"
   ```

Hasta tanto, todos los emails (password reset, verification) se loguean en consola del container.

### Activar Telegram notifications reales

1. Crear bot con @BotFather en Telegram → guardar token
2. Crear grupo privado del negocio → agregar bot → escribir `/start@bot` → ver chat_id
3. En el VPS:
   ```bash
   ssh root@178.104.183.249 "echo 'TELEGRAM_BOT_TOKEN=...' >> /opt/colacero/.env && echo 'TELEGRAM_NOTIFY_CHAT_ID=...' >> /opt/colacero/.env && echo 'TELEGRAM_PROVIDER=bot-api' >> /opt/colacero/.env"
   ssh root@178.104.183.249 "docker compose -f /opt/colacero/infra/docker-compose.prod.yml restart api"
   ```

---

## Resolución de problemas

### "Login redirige al login otra vez"

**Causa típica:** cookies httpOnly no se setean correctamente desde el proxy del panel.

**Verificar:**
1. Abrir devtools → Network → ver el response del POST `/api/auth/owner/login`
2. Verificar que vienen tres headers `Set-Cookie`: `cc_access`, `cc_refresh`, `cc_csrf`
3. Si no, problema en `apps/panel/app/api/[...path]/route.ts`

### "Veo 502 Bad Gateway"

**Causa típica:** API container caído.

```bash
ssh root@178.104.183.249 "docker logs infra-api-1 --tail 30"
ssh root@178.104.183.249 "docker compose -f /opt/colacero/infra/docker-compose.prod.yml restart api"
```

Si crashea repetido: verificar que `prisma migrate deploy` esté al día y que `DATABASE_URL` use `postgres` (no `localhost`).

### "El catálogo de un negocio devuelve 404"

Posibles causas:
1. El slug está mal escrito (con guión vs sin guión)
2. El negocio está SUSPENDED — verificar en `/admin/businesses`
3. No existe — verificar `SELECT slug FROM "Business";`

### "Las migrations no se aplicaron"

```bash
ssh root@178.104.183.249 "docker exec infra-postgres-1 psql -U colacero -d colacero_prod -c 'SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at;'"
```

Si falta alguna: aplicar con método A o B (ver "Aplicar una migration de Prisma en prod" arriba).

### "El email de password reset / verification no llega"

Si `RESEND_API_KEY` no está configurado, los emails se loguean en consola en lugar de enviarse:

```bash
ssh root@178.104.183.249 "docker logs infra-api-1 --tail 50 | grep EMAIL_MOCK"
```

Copiar el link manualmente y pasarlo al cliente.

### "Veo el banner de verificar email pero ya verifiqué"

Refrescar la página (Ctrl+F5). El banner lee el estado al montar.

### "CI tests rojos pero deploy verde"

Es esperable. Los tests integration en CI fallan por env vars del runner (no tiene la DB conectada). El Deploy job sí compila y despliega. Si master deploy queda verde, el código está en prod.

---

## Apéndice — Estructura del repo

```
colacero/
├── apps/
│   ├── api/           # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints (auth, owner, catalog, admin, cart)
│   │   │   ├── plugins/     # fastify plugins (auth, csrf, prisma, redis, ...)
│   │   │   ├── services/    # auth, token, email, otp, telegram, whatsapp
│   │   │   └── server.ts    # entry
│   │   └── Dockerfile
│   ├── catalog/       # Next.js público (multi-tenant subdomain)
│   │   ├── app/
│   │   │   ├── page.tsx           # landing colacero.com
│   │   │   ├── [slug]/page.tsx    # catálogo del negocio
│   │   │   └── [slug]/track/...   # track de pedido
│   │   ├── middleware.ts          # subdomain → slug rewrite
│   │   └── lib/tenant.ts          # parseTenantFromHost
│   └── panel/         # Next.js panel del dueño + admin
│       └── app/
│           ├── login/, forgot-password/, reset-password/, verify-email/
│           ├── dashboard/, orders/, products/, customers/, ...
│           └── admin/businesses/  # super-admin
│
├── packages/
│   ├── db/            # Prisma client + migrations + seed
│   ├── env/           # Zod env schema
│   └── shared/        # tipos + slug-blocklist
│
├── infra/
│   ├── docker-compose.prod.yml
│   └── docker-compose.dev.yml
│
└── docs/
    ├── STATUS.md      # este reporte
    └── USER_MANUAL.md # este manual
```

---

## Apéndice — Quién contacta para qué

| Problema | A quién |
|----------|---------|
| No puedo entrar al panel | Mandá email a `admin@colacero.com` o Telegram |
| Quiero cambiar el horario de mis ventanas | Lo hacés vos en **Ventanas** |
| Quiero agregar un staff a mi panel | Lo hacés vos en **Configuración → Staff** |
| Quiero suspender mi negocio temporal | Telegram al admin |
| Quiero ver un dato que no aparece en el dashboard | Telegram al admin, lo agregamos |
| Algo no funciona en mi catálogo | Telegram al admin con captura |
