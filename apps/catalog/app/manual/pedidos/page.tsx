import { H1, Lead, H2, H3, P, Strong, Ul, Note, ScreenshotPlaceholder, PrevNext } from '../../../components/doc-components'

export const metadata = { title: 'Pedidos' }

export default function PedidosPage() {
  return (
    <>
      <H1>Atender pedidos</H1>
      <Lead>
        El flujo de un pedido desde que entra hasta que el cliente se lo lleva. Trabajamos en formato
        kanban para que sepas en cada momento qué tenés en cada estado.
      </Lead>

      <H2 id="ciclo">El ciclo de un pedido</H2>
      <pre className="my-6 overflow-x-auto rounded-2xl glass p-4 text-sm" style={{ color: 'var(--text)' }}>
{`CONFIRMED  →  PREPARING  →  READY  →  PICKED_UP
              (vos lo movés)`}
      </pre>

      <H3>CONFIRMED — Confirmado</H3>
      <P>
        El cliente completó el checkout y la orden quedó firme. Se le asigna un <Strong>código de
        recogida de 6 caracteres</Strong> (ej. KX7P2M). Vos lo movés cuando empezás a preparar.
      </P>

      <H3>PREPARING — En preparación</H3>
      <P>
        Estado que indica que el negocio está armando el pedido. Útil cuando hay más de una persona
        en el staff para que se coordinen.
      </P>

      <H3>READY — Listo para recoger</H3>
      <P>
        El pedido está listo. El cliente ve el cambio en su página de seguimiento y sabe que ya
        puede pasar a buscarlo.
      </P>

      <H3>PICKED_UP — Entregado</H3>
      <P>
        El cliente vino y se lo llevó. Cerrás la orden. Esta queda contabilizada en analytics como
        completada (suma a tus ingresos).
      </P>

      <H2 id="cancelar">Cancelar un pedido</H2>
      <P>
        Si el cliente cancela o no aparece a recoger, podés mover el pedido a <Strong>CANCELLED</Strong>.
        No suma a ingresos ni a entregados, pero queda en el conteo histórico.
      </P>

      <H2 id="kanban">La vista kanban</H2>
      <P>
        En <Strong>Pedidos</Strong> ves las órdenes agrupadas por fecha y ventana. Podés navegar a
        días anteriores o futuros (hasta 30 días adelante).
      </P>
      <ScreenshotPlaceholder caption="Vista kanban de pedidos" />

      <Note tone="tip">
        Tip: <Strong>Cola de preparación</Strong> es una vista alterna donde solo ves lo urgente —
        pedidos confirmados/en prep de hoy ordenados por hora de recogida. Ideal para imprimir y
        tener a mano en la cocina.
      </Note>

      <H2 id="codigo">El código de recogida</H2>
      <P>
        Cada pedido confirmado tiene un código único de 6 caracteres en mayúsculas. Cuando el
        cliente viene, te lo dice (o te lo muestra en su pantalla) y vos lo verificás.
      </P>
      <P>
        El cliente también puede compartir el link de seguimiento:
        <code className="ml-1">tunegocio.colacero.com/track/CODIGO</code>
      </P>

      <PrevNext
        prev={{ href: '/manual/ventanas', label: 'Ventanas' }}
        next={{ href: '/manual/analytics', label: 'Analytics' }}
      />
    </>
  )
}
