# Campaign Playbook — ColaCero

> Guía operativa para ejecutar la campaña de los primeros 5 clientes. Pensada para vos (Ariel) trabajando solo. **Foco: founder-led sales en Cuba.**

---

## Tabla de contenidos

1. [Las 3 herramientas que vas a usar todos los días](#las-3-herramientas)
2. [Workflow semanal](#workflow-semanal)
3. [Definiciones de cada estado del pipeline](#estados-pipeline)
4. [Plantillas de mensajes](#plantillas)
5. [Cuándo escalar vs cuándo pivotar](#escalar-vs-pivotar)
6. [Anti-patrones (lo que NO funciona)](#anti-patrones)

---

## <a name="las-3-herramientas"></a>1. Las 3 herramientas que vas a usar todos los días

### Outreach pipeline (Google Sheet)
**Para qué:** trackear los DMs que VOS envías proactivamente (outbound).
**Archivo:** `docs/marketing/outreach-pipeline.csv` → importalo a Google Sheets una vez y trabajás desde ahí.
**Cuándo lo tocás:** todos los días que mandes DMs o recibas respuestas.

### Content calendar (Google Sheet)
**Para qué:** planificar y ejecutar contenido (posts, carruseles, videos).
**Archivo:** `docs/marketing/content-calendar.csv`.
**Cuándo lo tocás:** lunes (planning) y al publicar cada post (estado + link + métricas).

### Weekly metrics (Google Sheet)
**Para qué:** ver si estás avanzando hacia los 5 clientes y decidir si pivotear.
**Archivo:** `docs/marketing/weekly-metrics.csv`.
**Cuándo lo tocás:** lunes a la mañana — escribís lo de la semana anterior y planeás la nueva.

### `/admin/leads` (panel)
**Para qué:** ver leads INBOUND (los que llenan el form en `/contacto` o `/`).
**Cuándo lo tocás:** todos los días — al menos miralo una vez. Tiene botón "Exportar CSV" para sumar a tu sheet de outreach si querés un master único.

---

## <a name="workflow-semanal"></a>2. Workflow semanal recomendado

### 🌅 Lunes — Planning + métricas (45 min)

1. **Abrí `weekly-metrics.csv`** y completá la semana anterior:
   - DMs enviados / Respuestas / Demos / Onboarded
   - Aprendizaje principal en 1 frase
   - Decisión para la nueva semana
2. **Abrí `outreach-pipeline.csv`** y revisá:
   - Quiénes están en `DM_SENT` hace +48h sin respuesta → mandales follow-up suave
   - Quiénes están en `DEMO_SCHEDULED` esta semana → confirmá día y hora
   - Sumá nuevos prospectos (target: 5-10 nuevos por semana)
3. **Abrí `content-calendar.csv`** y revisá:
   - Qué hay programado esta semana
   - ¿Tenés el contenido listo? Si no, qué necesitás hacer
   - Si vas a publicar carrusel, blockeá 1h para armarlo
4. **Mirá `/admin/leads`** del panel → si hay leads inbound nuevos, escribiles HOY

### 🌞 Martes-Jueves — Ejecución (30-60 min/día)

**Cada día tenés que hacer 2 de estas 3:**
- Mandar 3-5 DMs nuevos (script en sección 4)
- Publicar 1 pieza de contenido programada
- Hacer 1 demo agendada

**Después de cada DM o demo:** actualizá el pipeline INMEDIATAMENTE. No lo dejes para después — se pierde.

### 🌇 Viernes — Follow-ups + cierre (1h)

1. Revisá pipeline: ¿quiénes dijeron "déjame pensarlo"? Mandales follow-up.
2. A los que tuvieron demo esta semana: pregunta concreta "¿qué necesitarías para arrancar el lunes?"
3. Para los onboarded: mandale un mensaje preguntando cómo va.
4. Bloqueá la primera mitad del fin de semana para preparar contenido de la semana siguiente.

### 🌃 Domingo — Preparación silenciosa (30 min)

- Identificá 5-10 nuevos prospectos para mandar DM el lunes.
- Si tenés contenido planeado, prepará drafts.

---

## <a name="estados-pipeline"></a>3. Definiciones de cada estado del pipeline

| Estado | Qué significa | Próxima acción típica |
|--------|---------------|------------------------|
| `NEW` | Prospecto identificado, todavía no contactado | Enviar DM #1 (script frío) |
| `DM_SENT` | DM enviado, esperando respuesta | Esperar 48h, si no responde → follow-up |
| `RESPONDED` | Contestó algo (positivo o duda) | Responder con info relevante o propuesta de demo |
| `DEMO_SCHEDULED` | Acordaste día/hora para demo | Confirmar 30 min antes con link de Meet |
| `DEMO_DONE` | Hiciste el demo | Mensaje post-demo con resumen + pregunta concreta |
| `TRIAL` | Aceptó probarlo, le diste de alta | Acompañar onboarding, check-in en 7 días |
| `CONVERTED` | Está usando activamente y satisfecho | Pedir testimonio + referral |
| `LOST` | Dijo "no" o no responde después de 3 intentos | Re-targeting en 3 meses, mover a archivo |

**Regla:** un prospecto sin **próxima acción definida** no existe. Si está en tu pipeline pero no sabés qué le vas a hacer la próxima semana, o lo movés a `LOST` o le agregás acción concreta.

---

## <a name="plantillas"></a>4. Plantillas de mensajes

### 🎯 DM #1 — Cold (primer contacto)

```
Hola [nombre], vi tu negocio de [carne / viandas / pan / etc] en [grupo X / IG / referencia].

Soy Ariel, hace un mes lance una herramienta que arma catalogo + panel
de pedidos para negocios cubanos. Reemplaza el caos de recibir pedidos
por chat — el cliente entra a tu link, agrega al carrito, vos lo ves
organizado en un panel.

Esta GRATIS durante el beta (busco 5 negocios para acompañar).

Mira el demo de uno que ya lo usa: el-fogon.colacero.com

Te interesa una llamada de 15 min para que te lo muestre?
```

**Personalización clave:** `[nombre]` y `[lo vi en X]`. Sin esto se siente spam.

### 🔁 DM #2 — Follow-up (48h sin respuesta)

```
Hola [nombre], te escribí hace unos días sobre ColaCero. Sin presion
si no es para vos — solo queria asegurarme que viste el mensaje.

Si no es ahora, te entiendo. Si me decis "no me interesa" cierro y
no jodo mas. Si te interesa pero estas full esta semana, me decis
y volvemos a hablar cuando puedas.

Demo en vivo: el-fogon.colacero.com
```

**Por qué funciona:** sin presión, opt-out explícito, valor visible.

### 🤝 Mensaje post-demo

```
Gracias por el tiempo, [nombre]. Recapitulo lo que vimos:

• [Feature 1 que mas le interesó]
• [Feature 2 relevante para su caso]
• Precio: gratis durante el beta, despues plan fijo sin comisiones

Pregunta concreta: que necesitarias para arrancar [con un trial / la semana que viene]?

Si arrancamos, en una llamada de 1h cargamos tus productos juntos y
queda funcionando.
```

**La pregunta concreta es clave.** No "qué te pareció" (vago) sino "qué necesitarías para arrancar" (avanza la negociación).

### 🎉 Mensaje post-onboarding (día 1)

```
[Nombre], ya quedaste con todo cargado en colacero.com/[slug]. 

Pasos sugeridos esta semana:
1. Compartile el link a 5 clientes habituales para probar
2. Avisame cualquier fricción que sientas
3. La semana que viene me decis qué te funcionó y qué no

Cualquier duda, escribime directo a mí — no por el form.
```

### 📈 Check-in dia 7

```
[Nombre], cómo van estos primeros días? 

Pregunta corta: si tuvieras que cambiar 1 sola cosa de ColaCero,
qué cambiarías?

(Sirve para entender qué priorizar)
```

### 🙏 Pedido de referral (día 30 si está activo)

```
[Nombre], cómo va? Una pregunta: si te sirve ColaCero, conoces 1-2
negocios mas a los que les pueda funcionar?

Si me los recomendas, los acompaño en el alta como hice con vos.
```

---

## <a name="escalar-vs-pivotar"></a>5. Cuándo escalar vs cuándo pivotar

Cada lunes mirá `weekly-metrics.csv` y respondé estas preguntas:

### Indicadores de salud (semana típica buena)

- **Response rate > 25%** → tu mensaje funciona
- **Demo agendada por cada 3 respuestas** → tu pitch en chat funciona
- **Onboarded por cada 2 demos** → tu demo en vivo cierra
- **Al menos 1 lead inbound por semana** → tu landing trae

### 🟢 Si TODO está en verde por 2 semanas seguidas

**Escalá:** subí el volumen.
- De 10 DMs/semana → 25
- Empezá a publicar contenido (carruseles + video)
- Pitch a El Toque o medio cubano para earned media

### 🟡 Si response rate < 20% por 2 semanas

**Pivotá el mensaje, NO el target:**
- Re-escribí el DM #1 con nuevo ángulo (probá B/C)
- Mostrale el cambio a un cliente real y pediles feedback honesto
- Mantené el mismo target — solo cambia lo que decís

### 🟡 Si response > 25% pero demos < 1 por 2 semanas

**Pivotá la oferta o el momento:**
- Quizá pedir "15 min de demo" es mucho — probá "te grabo un video de 90 seg con tu nombre"
- O probá menos formal: "te paso captura del panel y me dices qué pensas"

### 🔴 Si onboarded = 0 después de 4 semanas

**Algo fundamental no está funcionando.** Posibles causas:
1. Target equivocado (estás hablando con quienes no necesitan esto)
2. El producto no resuelve un pain real (revisar entrevistas con leads que dijeron no)
3. Falta credibilidad (necesitas el primer caso real fuerte)

**Acción:** parar campaña, hacer 5 entrevistas honestas con leads que dijeron "no" para entender el por qué.

---

## <a name="anti-patrones"></a>6. Anti-patrones — lo que NO hagas

### ❌ Mandar el mismo DM copy-paste a 50 personas
**Por qué falla:** lo identifican como spam, te denuncian, te limitan.
**Hacer:** máximo 5-10 DMs por día, todos personalizados.

### ❌ Publicar en grupos de venta directa de Cuba
**Por qué falla:** son grupos para que venda gente, no para promo de servicios. Te banean.
**Hacer:** publicar en grupos de **emprendimiento** o **tecnología**.

### ❌ Métricas vanity (followers, likes)
**Por qué falla:** no te traen clientes. Te entretienen.
**Hacer:** trackear solo respuesta → demo → onboarding.

### ❌ Esperar que el form de la landing traiga 10 leads/semana solo
**Por qué falla:** el form solo convierte tráfico que YA tenés. Sin tráfico, sin leads.
**Hacer:** el outreach manual es el motor. Form es secundario.

### ❌ Bajar el precio cuando te dicen "no"
**Por qué falla:** ya está gratis. Si te dicen no es porque NO LO ENTIENDEN o NO LO NECESITAN. Bajar precio no resuelve eso.
**Hacer:** preguntar qué necesitan, no asumir que es precio.

### ❌ Hacer demos sin pre-calificar
**Por qué falla:** vas a perder 1h con alguien que no era target.
**Hacer:** antes del demo preguntá "cuántos pedidos por semana manejás? ¿por qué medio los recibís?" Si no calza, no demo.

### ❌ Construir features que pide cada lead individual
**Por qué falla:** la próxima necesitará otra cosa. Te perdés.
**Hacer:** documentá los pedidos. Si 3+ piden lo mismo, ahí sí construilo.

---

## Cómo importar los CSVs a Google Sheets

1. Andá a [sheets.new](https://sheets.new) o creá un sheet nuevo
2. Archivo → Importar
3. Subí el CSV
4. "Reemplazar hoja actual" + "Detectar separador automaticamente"
5. Listo

Repetilo para los 3 CSVs (cada uno en su propio Google Sheet, o en pestañas del mismo).

**Tip:** poné colores condicionales a la columna `Estado` para verlo de un vistazo:
- `NEW` → gris
- `DM_SENT` → amarillo
- `RESPONDED` → azul claro
- `DEMO_SCHEDULED` / `DEMO_DONE` → naranja
- `TRIAL` → violeta
- `CONVERTED` → verde
- `LOST` → rojo apagado

---

## Resumen — qué hacés mañana

1. Importás los 3 CSVs a Google Sheets (15 min)
2. Identificás 10 prospectos cubanos para los primeros DMs (30 min de research)
3. Mandás 3-5 DMs hoy (30 min)
4. Actualizás el pipeline después de cada DM
5. Repetís toda la semana

A los 7 días, **deberías tener al menos 1 demo agendada.** Si no, leé sección 5 y pivotá el mensaje.

**Suerte. Lo único entre vos y los primeros 5 clientes es ejecutar.**
