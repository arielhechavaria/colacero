# ADR-001: pnpm workspaces + Turborepo

**Estado:** Aceptado | **Fecha:** 2026-04-27

## Contexto
Monorepo con 3 apps (api, catalog, panel) y 3 packages (db, env, shared).
Necesitamos builds incrementales y gestión de dependencias cruzadas.

## Decisión
pnpm workspaces para gestión de node_modules + Turborepo para el pipeline de tareas.

## Consecuencias
- `pnpm install` en raíz instala todo el workspace
- `turbo run build` construye en orden de dependencias automáticamente
- Cache local de Turborepo acelera rebuilds en CI
- Alternativa descartada: Nx (más complejo para equipo de 1 persona)
