import { H1, H2, P, Strong, Ul, Note, PrevNext } from '../../components/doc-components'

export default function ManualIndex() {
  return (
    <>
      <H1>Manual de usuario</H1>
      <P>
        Esta guía te lleva paso a paso para que vos y tu equipo aprovechen ColaCero al máximo.
        Está pensada para dueños y staff de negocios cubanos — sin jerga técnica.
      </P>

      <H2>¿Qué es ColaCero?</H2>
      <P>
        Una plataforma que te permite recibir pedidos online de tus clientes (vía Telegram, WhatsApp o un link directo),
        gestionar tu inventario, definir horarios de recogida y atender la cola desde un panel limpio.
        <Strong> Cero comisiones por pedido</Strong> — pagás un plan fijo (gratis durante el beta).
      </P>

      <H2>¿Para quién es?</H2>
      <Ul>
        <li>Negocios de venta de alimentos (carnicerías, viandas, panaderías, lácteos)</li>
        <li>Pequeños emprendimientos que ya venden por mensajería</li>
        <li>Tiendas físicas que quieren recibir reservas antes de que el cliente venga</li>
      </Ul>

      <H2>¿Qué incluye?</H2>
      <Ul>
        <li><Strong>Catálogo público</Strong> en tu propio subdominio (`tunegocio.colacero.com`)</li>
        <li><Strong>Panel de gestión</Strong> con productos, inventario, pedidos kanban, clientes</li>
        <li><Strong>Auth por Telegram</Strong> — tus clientes entran con un clic</li>
        <li><Strong>Ventanas de recogida</Strong> con cupos limitados</li>
        <li><Strong>Analytics</Strong> con KPIs, top productos, co-compras, stock alerts</li>
        <li><Strong>Anuncios</Strong> broadcast a tu canal de Telegram</li>
      </Ul>

      <Note tone="tip">
        ¿Primer contacto?{' '}
        <a href="https://panel.colacero.com/signup" className="underline">Creá tu negocio gratis</a>{' '}
        en 2 minutos. Después seguí esta guía para configurar todo.
        Si preferís que te ayudemos, escribinos por{' '}
        <a href="https://t.me/Arielhechavarria" className="underline" target="_blank" rel="noopener noreferrer">Telegram</a>.
      </Note>

      <PrevNext
        next={{ href: '/manual/empezar', label: 'Empezar' }}
      />
    </>
  )
}
