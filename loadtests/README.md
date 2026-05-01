# Load Tests — ColaCero

Tests de concurrencia para validar el anti-overselling bajo carga.

## Instalación de k6

```bash
# Windows (Chocolatey)
choco install k6

# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## Antes de correr

```bash
# 1. Levantar la infra
pnpm dev

# 2. Seed de datos (si no está hecho)
pnpm db:seed
```

## Tests disponibles

### reserve-concurrency.js

Valida que el optimistic lock en Redis impide overselling cuando 50 clientes
intentan reservar el mismo producto simultáneamente.

```bash
# Corrida estándar (50 VUs)
k6 run loadtests/reserve-concurrency.js

# Corrida con más carga
k6 run --vus 100 --duration 15s loadtests/reserve-concurrency.js

# Con producto específico
k6 run -e PRODUCT_ID=<uuid> loadtests/reserve-concurrency.js
```

### Métricas clave a observar

| Métrica | Threshold | Descripción |
|---------|-----------|-------------|
| `oversell_detected` | == 0 | Nunca debe haber stock negativo |
| `reserve_success` | > 0 | Al menos 1 reserva exitosa |
| `reserve_fail_rate` | — | % de rechazos por stock insuficiente (esperado cuando el stock se agota) |
| `http_req_duration p(95)` | < 2000ms | Latencia bajo carga |

### Resultado esperado

```
✓ oversell_detected: count==0    ← CRÍTICO: nunca debe fallar
✓ reserve_success: count>0
✓ http_req_duration: p(95)<2000ms

Stock final: 0 (si 50 VUs agotaron stock de 50 unidades)
✅ Sin oversell — stock final >= 0
```

## Cuándo correr

- Antes de cada release a producción
- Después de cambios en `reservation.service.ts`
- Después de cambios en la config de Redis
