# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## Project Skills

| Trigger | Skill | Path |
|---------|-------|------|
| Antes de abrir cualquier PR — code review final | cuba-review | ../skills/cuba-review/SKILL.md |
| Leer/mover tareas en Notion, actualizar estados de sprint | notion-tasks | ../skills/notion-tasks/SKILL.md |
| Crear o modificar endpoints en Fastify | api-route | ../skills/api-route/SKILL.md |
| Crear o modificar migraciones de Prisma | migration | ../skills/migration/SKILL.md |
| Crear componentes Vue 3 en el panel admin | vue-component | ../skills/vue-component/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### cuba-review
- Revisar bundle JS < 200KB con next build
- Usar next/image para todas las imágenes (lazy load + WebP)
- No usar Google Fonts en línea (bloqueado desde Cuba)
- AWS NO usado (puede estar bloqueado), preferir Hetzner/Cloudflare
- WhatsApp: usar Cloud API oficial (NO whatsapp-web.js)
- OTP expira en 10 min (Redis TTL), teléfono en E.164
- Optimistic locking con version para decremento de stock
- Verificar affected_rows en $executeRaw (overselling protection)
- Mobile-first: botones 44px mínimo, texto 14px mínimo
- PWA: service worker cachea vista principal, cola de acciones offline
- JWT verifica resource belong al business_id del token

### notion-tasks
- Crear tarea → estado inicial siempre "Backlog"
- Nunca cambiar tarea que no pertenece al agente (campo Agente)
- No saltar de "En spec" a "En desarrollo" — pasar por "Spec aprobada"
- P0 bloquea el sprint — reportar antes de continuar
- Transiciones: Backlog→En spec→Spec aprobada→En desarrollo→En review→Done
- Crear Design Doc en estado "Draft", actualizar a "Implementado" al done

### api-route
- FastifyPluginAsync con Zod schemas → JSON Schema via zodToJsonSchema
- Error handling: fastify.httpErrors (notFound, forbidden, conflict, unprocessableEntity)
- Siempre verificar recurso pertenece al business_id del JWT
- Auth: fastify.authenticate (owner), fastify.authenticateCustomer (customer)
- Inventory: optimistic locking con $executeRaw + version field check

### migration
- Prisma 5 con PostgreSQL 16
- Comando: pnpm --filter @colacero/db migrate:dev --name [nombre]
- Nueva columna NOT NULL requiere default o puede causar downtime
- Siempre incluir campo version Int @default(0) para optimistic locking
- Respetar índices críticos documentados en schema base
- snake_case descriptivo para nombres de migración

### vue-component
- Vue 3.4+ con script setup lang=ts + Composition API
- Props y emits completamente tipados
- Loading state visible, error message claro
- Botones táctiles: mínimo h-12 px-6
- Colores estados: draft/confirmed→blue, preparing→yellow, ready→green, picked_up→gray, cancelled/expired→red
- Store: Pinia en src/stores/, usar $patch para actualizaciones optimistas
- Ubicación: UI base→src/components/ui/, dominio→src/components/[domain]/
- Iconos: Heroicons desde @heroicons/vue/24/outline

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | ./AGENTS.md | Index — references skills above |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.