# ADR-004: D3.js para visualizaciones del panel

**Estado:** Diferido a fase 2 | **Fecha:** 2026-08-26

## Contexto

Hoy el panel no usa ninguna librería de gráficos. Las visualizaciones del
dashboard (`apps/panel/app/dashboard/page.tsx`) están hechas con divs y Tailwind:

| Componente | Datos |
|------------|-------|
| `WeeklyChart` | 7 barras (días de la semana) |
| `TopProductsList` | 5 barras |
| `CoPurchasesCard` | ~5 barras |
| `FulfillmentBar` | 1 barra de progreso |

La agregación ocurre en Postgres vía Prisma (`apps/api/src/routes/owner/stats/`),
así que al cliente le llegan arrays ya reducidos de 5-7 elementos.

Se planteó adoptar D3.js como base de visualización del sistema.

## Propuesta evaluada

Adoptar los módulos sueltos (`d3-scale`, `d3-shape`, `d3-array`, ~12 KB) en vez
del bundle completo (~250 KB), dentro de un `packages/charts-core` de TS puro que
devuelva geometría, con un adaptador de framework deliberadamente delgado encima.

Argumentos registrados a favor:

- Los módulos de D3 son funciones puras sin DOM: sobreviven intactos la migración
  prevista de React a Angular, a diferencia de cualquier librería de gráficos
  atada a React (Recharts, visx, Nivo, Tremor), que sería código muerto.
- Habilita visualizaciones que las barras de div no pueden representar —
  principalmente un heatmap de ocupación de ventanas de retiro (hora × día).
- `packages/shared` es precedente de package TS sin dependencias de framework.

Argumentos registrados en contra:

- Los volúmenes actuales (5-7 puntos) no justifican una librería de visualización.
- Las barras actuales cuestan 0 KB de JS y animan con CSS; reescribirlas no aporta
  información nueva.
- Presupuestos de LHCI en móvil 3G con CPU 4× (`lighthouserc.js`).

## Decisión

**Diferida.** No se adopta D3 ni ninguna librería de gráficos en esta fase. Las
visualizaciones actuales se mantienen como están. El tema se reabre en fase 2.

El análisis técnico no se consideró suficiente para justificar la adopción ahora.

## Qué revisar en fase 2

- ¿Existe ya una visualización pedida que las barras de div no puedan representar
  (heatmap de ventanas, serie temporal con rango custom, grafo de co-compras)?
- ¿En qué estado está la migración a Angular? Determina cuánto invertir en un
  adaptador React desechable.
- Si se adopta: módulos sueltos, nunca `import * as d3` ni `d3-selection` — este
  último rompe el change detection tanto de React como de Angular con OnPush,
  signals o zoneless.
- Restringido al panel. Nunca en `catalog`, que es donde mide LHCI.
