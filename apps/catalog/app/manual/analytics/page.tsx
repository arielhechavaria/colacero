import { H1, Lead, H2, H3, P, Strong, Ul, Note, ScreenshotPlaceholder, PrevNext } from '../../../components/doc-components'

export const metadata = { title: 'Analytics' }

export default function AnalyticsPage() {
  return (
    <>
      <H1>Analytics</H1>
      <Lead>
        El dashboard te muestra cómo viene tu negocio. Estas son las métricas y cómo interpretarlas.
      </Lead>

      <H2 id="periodo">Selector de período</H2>
      <P>
        Arriba del dashboard tenés un selector con presets: <em>Hoy</em>, <em>Ayer</em>, <em>Últimos
        7 días</em>, <em>Esta semana</em>, <em>Este mes</em>, <em>Mes anterior</em>, o <em>Custom</em>
        con fechas elegidas a mano.
      </P>

      <H2 id="kpis">KPIs principales</H2>
      <Ul>
        <li><Strong>Ingresos</Strong>: suma de subtotales de pedidos PICKED_UP en el período</li>
        <li><Strong>Pedidos</Strong>: total de órdenes (incluye canceladas y entregadas)</li>
        <li><Strong>Entregados</Strong>: solo PICKED_UP</li>
        <li><Strong>Ticket promedio</Strong>: ingresos / entregados</li>
        <li><Strong>Cumplimiento</Strong>: % de pedidos que llegaron a PICKED_UP vs. total</li>
      </Ul>
      <ScreenshotPlaceholder caption="Dashboard con KPIs principales" />

      <H2 id="top-productos">Top productos</H2>
      <P>
        Ranking de los productos más vendidos por unidad. Sirve para identificar qué mantener en
        stock alto y qué quizás descontinuar.
      </P>

      <H2 id="copurchases">Co-compras</H2>
      <P>
        Qué productos se compran juntos con más frecuencia. Útil para:
      </P>
      <Ul>
        <li>Armar combos o promos cruzadas</li>
        <li>Reorganizar el catálogo (productos relacionados cerca)</li>
        <li>Decidir qué reabastecer en conjunto</li>
      </Ul>

      <H2 id="weekly">Weekly trends</H2>
      <P>
        Gráfico de barras con pedidos por día de los últimos 7 días. Identificás patrones (lunes
        suaves, viernes/sábados fuertes, etc.).
      </P>

      <H2 id="stock-alerts">Stock alerts</H2>
      <P>
        Lista de productos con stock por debajo de su umbral configurado, o sin stock (cero). Click
        en cualquier alerta te lleva a Productos para ajustar.
      </P>

      <Note tone="tip">
        Para que las analytics tengan sentido, asegurate de mover los pedidos a <Strong>PICKED_UP</Strong>
        cuando el cliente se los lleva. Si los dejás en READY, no cuentan como entregados.
      </Note>

      <PrevNext
        prev={{ href: '/manual/pedidos', label: 'Pedidos' }}
        next={{ href: '/manual/configuracion', label: 'Configuración' }}
      />
    </>
  )
}
