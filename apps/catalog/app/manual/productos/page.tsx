import { H1, Lead, H2, P, Strong, Ol, Ul, Note, ScreenshotPlaceholder, PrevNext } from '../../../components/doc-components'

export const metadata = { title: 'Productos' }

export default function ProductosPage() {
  return (
    <>
      <H1>Productos</H1>
      <Lead>
        Cómo cargar productos en tu catálogo, manejar el inventario y mantener stock actualizado.
      </Lead>

      <H2 id="crear">Crear un producto</H2>
      <P>
        En el panel: <Strong>Productos → +Nuevo producto</Strong>.
      </P>
      <ScreenshotPlaceholder caption="Modal de creación de producto" />

      <P><Strong>Campos obligatorios:</Strong></P>
      <Ul>
        <li><Strong>Nombre</Strong> — ej. "Pollo entero"</li>
        <li><Strong>Precio unitario</Strong> — en CUP</li>
        <li><Strong>Unidad</Strong> — libra, kg, unidad, litro, etc. (o personalizada)</li>
      </Ul>

      <P><Strong>Campos opcionales:</Strong></P>
      <Ul>
        <li><Strong>SKU</Strong> — código interno (ej. POLLO-01)</li>
        <li><Strong>Categoría</Strong> — agrupa productos en el catálogo</li>
        <li><Strong>Descripción</Strong> — texto breve</li>
        <li><Strong>Imagen</Strong> — subí una foto. Si no, mostramos una de Unsplash según el nombre</li>
        <li><Strong>Stock inicial</Strong> — podés cargarlo después</li>
      </Ul>

      <Note tone="tip">
        Las imágenes propias siempre se ven mejor que el fallback automático. Recomendamos subir foto a tus
        productos más vendidos lo antes posible.
      </Note>

      <H2 id="inventario">Manejar inventario</H2>
      <P>
        Cada producto tiene un inventario con:
      </P>
      <Ul>
        <li><Strong>Disponible</Strong> — cuánto stock tenés ahora</li>
        <li><Strong>Reservado</Strong> — cuánto está apartado por pedidos abiertos</li>
        <li><Strong>Umbral bajo</Strong> — debajo de este número, el producto aparece en "Stock alerts"</li>
      </Ul>

      <Note tone="warning">
        El stock se reserva automáticamente cuando un cliente agrega al carrito (5 minutos). Si no
        completa el checkout, vuelve a estar disponible. Esto evita vender lo que no tenés.
      </Note>

      <H2 id="filtros">Filtros y búsqueda</H2>
      <P>
        En la lista de productos podés:
      </P>
      <Ol>
        <li>Buscar por nombre</li>
        <li>Filtrar por categoría</li>
        <li>Ordenar por nombre, precio o stock</li>
      </Ol>

      <H2 id="desactivar">Desactivar un producto</H2>
      <P>
        Si querés que un producto deje de aparecer en el catálogo sin borrarlo (porque tal vez vuelve después),
        usá el toggle <Strong>"Activo"</Strong>. Lo podés re-activar cuando quieras.
      </P>

      <PrevNext
        prev={{ href: '/manual/empezar', label: 'Empezar' }}
        next={{ href: '/manual/ventanas', label: 'Ventanas' }}
      />
    </>
  )
}
