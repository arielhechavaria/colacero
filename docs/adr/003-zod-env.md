# ADR-003: Zod para validación de variables de entorno

**Estado:** Aceptado | **Fecha:** 2026-04-27

## Contexto
Las variables de entorno incorrectas causan errores silenciosos en runtime.
Necesitamos fail-fast con mensajes claros.

## Decisión
Package `@colacero/env` con schema Zod que valida `process.env` al arrancar.

## Consecuencias
- Todo acceso a env vars es via `import { env } from '@colacero/env'`
- Si falta una variable requerida: `process.exit(1)` con mensaje descriptivo
- El schema es exportable y testeable sin efectos secundarios
- TypeScript infiere los tipos automáticamente del schema Zod
