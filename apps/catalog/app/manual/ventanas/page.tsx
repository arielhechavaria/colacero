import { H1, Lead, H2, P, Strong, Ul, Note, ScreenshotPlaceholder, PrevNext } from '../../../components/doc-components'

export const metadata = { title: 'Ventanas de recogida' }

export default function VentanasPage() {
  return (
    <>
      <H1>Ventanas de recogida</H1>
      <Lead>
        Las ventanas son los horarios en los que tus clientes pueden venir a recoger. Definís cuándo
        querés atender y cuántos pedidos máximo aceptar por horario.
      </Lead>

      <H2 id="por-que">¿Por qué usar ventanas?</H2>
      <Ul>
        <li>Concentrás la atención en horarios específicos (no estás todo el día)</li>
        <li>Evitás que se te junten 20 pedidos a la misma hora</li>
        <li>Tus clientes ven exactamente cuándo pueden venir</li>
        <li>El sistema rechaza pedidos cuando la ventana se llena</li>
      </Ul>

      <H2 id="crear-ventana">Crear una ventana</H2>
      <P>
        En el panel: <Strong>Ventanas → +Nueva ventana</Strong>. Llenás:
      </P>
      <Ul>
        <li><Strong>Fecha</Strong></li>
        <li><Strong>Hora de inicio</Strong> y <Strong>hora de fin</Strong></li>
        <li><Strong>Capacidad</Strong> — cuántos pedidos podés atender en esa ventana</li>
      </Ul>
      <ScreenshotPlaceholder caption="Pantalla de gestión de ventanas" />

      <H2 id="generar-manana">Generar las ventanas de mañana</H2>
      <P>
        Botón <Strong>"Generar mañana"</Strong> crea automáticamente las ventanas del día siguiente
        con los mismos horarios que usaste en días recientes. Útil para no olvidarte.
      </P>

      <Note tone="info">
        Si una ventana está <Strong>cerrada</Strong> (toggle), los clientes pueden verla en el catálogo
        pero no pueden seleccionarla al hacer checkout.
      </Note>

      <H2 id="cupos">Cupos y reservas</H2>
      <P>
        Cuando un cliente confirma un pedido, ocupa un cupo de la ventana. Cuando se llena,
        nuevos clientes ven "Ventana llena" y deben elegir otra.
      </P>
      <Note tone="tip">
        Si querés cancelar una ventana porque tenés un imprevisto, podés <Strong>cerrarla</Strong>.
        Los pedidos ya confirmados siguen — solo evita nuevos.
      </Note>

      <PrevNext
        prev={{ href: '/manual/productos', label: 'Productos' }}
        next={{ href: '/manual/pedidos', label: 'Pedidos' }}
      />
    </>
  )
}
