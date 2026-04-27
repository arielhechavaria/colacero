# ADR-002: Prisma ORM

**Estado:** Aceptado | **Fecha:** 2026-04-27

## Contexto
Necesitamos ORM para PostgreSQL 16 con soporte de migraciones deterministas.

## Decisión
Prisma 5 con `prisma migrate` para gestión de schema.

## Consecuencias
- Schema como fuente de verdad única (schema.prisma)
- `prisma validate` en CI previene divergencias antes del deploy
- `prisma migrate deploy` en producción es idempotente
- El Prisma Client se genera en `packages/db` y se importa desde ahí
- Alternativa descartada: Drizzle (migraciones más manuales, DX menor)
