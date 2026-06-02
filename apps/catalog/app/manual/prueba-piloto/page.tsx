import {
  H1, Lead, H2, H3, P, Strong, Ol, Ul, Note,
  Step, CheckList, CheckItem, ScreenshotPlaceholder, PrevNext,
} from '../../../components/doc-components'

export const metadata = { title: 'Prueba piloto — Guía completa' }

export default function PruebaPilotoPage() {
  return (
    <>
      <H1>Prueba piloto</H1>
      <Lead>
        Esta guía te lleva paso a paso por el flujo completo del ecosistema ColaCero:
        desde crear el negocio hasta atender el primer pedido real. Ideal para validar
        que todo funciona antes de compartir el catálogo con tus clientes.
      </Lead>

      <Note tone="info">
        <Strong>Tiempo estimado:</Strong> 30–40 minutos para recorrer todo el flujo por primera vez.
        Una vez configurado, el día a día tarda segundos.
      </Note>

      {/* ─────────────────────────────────────────────────────── */}
      <H2 id="parte-1">Parte 1 — Configurar el negocio</H2>
      <P>Todo desde el panel. Hacé esto antes de compartir el link del catálogo.</P>

      <Step n={1} title="Crear tu cuenta">
        <P>
          Entrá a{' '}
          <a href="https://panel.colacero.com/signup" className="underline" target="_blank" rel="noopener noreferrer">
            panel.colacero.com/signup
          </a>{' '}
          y completá el formulario:
        </P>
        <Ol>
          <li><Strong>Nombre del negocio</Strong> — el que ven tus clientes</li>
          <li><Strong>URL del catálogo</Strong> — se genera automático; podés editarla (solo letras, números y guiones)</li>
          <li><Strong>Email</Strong> y <Strong>contraseña</Strong> (mínimo 10 caracteres)</li>
          <li>Click en <Strong>"Crear mi negocio →"</Strong></li>
        </Ol>
        <Note tone="tip">
          La URL del catálogo va a ser <code>tunegocio.colacero.com</code>. Elegí algo corto y sin tildes.
          Una vez creada, no se puede cambiar desde el panel.
        </Note>
        <CheckList>
          <CheckItem>Formulario enviado → redirige al dashboard</CheckItem>
          <CheckItem>El banner amarillo de verificación de email aparece arriba</CheckItem>
        </CheckList>
      </Step>

      <Step n={2} title="Verificar tu email">
        <Ol>
          <li>Click en <Strong>"Reenviar email"</Strong> en el banner amarillo</li>
          <li>Buscá el email en tu casilla (puede tardar 1–2 min; revisá spam)</li>
          <li>Click en el link del email → el banner desaparece</li>
        </Ol>
        <CheckList>
          <CheckItem>Banner amarillo desaparece después de verificar</CheckItem>
        </CheckList>
      </Step>

      <Step n={3} title="Cargar productos">
        <P>Andá a <Strong>Productos → "＋ Nuevo producto"</Strong>.</P>
        <P>Por cada producto cargá:</P>
        <Ul>
          <li><Strong>Nombre</Strong> — claro y sin abreviaturas</li>
          <li><Strong>Precio</Strong> — en la moneda que usés</li>
          <li><Strong>Unidad</Strong> — libra, kg, unidad, caja, etc.</li>
          <li><Strong>Categoría</Strong> — agrupa el catálogo (Carnes, Granos, Lácteos...)</li>
          <li><Strong>Stock inicial</Strong> — cuántas unidades tenés hoy</li>
          <li><Strong>Stock mínimo</Strong> — el sistema te avisa cuando baja de este número</li>
        </Ul>
        <Note tone="tip">
          Si no tenés foto, el sistema asigna una imagen automáticamente según el nombre del producto.
          Funciona bien para nombres comunes como "Pollo", "Arroz", "Leche", etc.
        </Note>
        <CheckList>
          <CheckItem>Al menos 3 productos visibles en la lista</CheckItem>
          <CheckItem>Cada producto con precio y stock mayor a 0</CheckItem>
          <CheckItem>Al abrir el catálogo (<code>tunegocio.colacero.com</code>) los productos aparecen</CheckItem>
        </CheckList>
        <ScreenshotPlaceholder caption="Vista de la lista de productos con categorías" />
      </Step>

      <Step n={4} title="Configurar ventanas de recogida">
        <P>
          Las ventanas de recogida son los horarios en que los clientes pueden venir a buscar sus pedidos.
          Sin ventanas configuradas, el catálogo no acepta pedidos.
        </P>
        <P>Andá a <Strong>Ventanas → "📆 Generar L-V (30 días)"</Strong>.</P>
        <P>
          Esto crea automáticamente ventanas de lunes a viernes, 8am–5pm, con capacidad de 20 pedidos cada una,
          para los próximos 30 días. Después podés editarlas individualmente.
        </P>
        <Note tone="info">
          Si tu negocio tiene horarios distintos (fines de semana, turno tarde), podés crear ventanas
          manualmente con el botón <Strong>"＋ Nueva ventana"</Strong>.
        </Note>
        <CheckList>
          <CheckItem>Ventanas de hoy y los próximos días visibles en la lista</CheckItem>
          <CheckItem>Cada ventana muestra fecha, hora y capacidad</CheckItem>
        </CheckList>
      </Step>

      <Step n={5} title="Configurar Telegram">
        <P>
          Telegram es el canal de comunicación con tus clientes. Hay dos usos:
          <Strong> notificaciones de pedidos</Strong> (al grupo del negocio) y
          <Strong> anuncios broadcast</Strong> (a un canal público).
        </P>

        <H3>5a — Crear el bot del negocio</H3>
        <Ol>
          <li>Abrí Telegram y buscá <Strong>@BotFather</Strong></li>
          <li>Enviá <code>/newbot</code></li>
          <li>Poné el nombre que quieras (ej. <code>El Fogón Notificaciones</code>)</li>
          <li>Poné el username (termina en <code>bot</code>, ej. <code>elfogon_bot</code>)</li>
          <li>BotFather te da el <Strong>token del bot</Strong> — copialo, lo vas a necesitar</li>
        </Ol>

        <H3>5b — Obtener el Chat ID del grupo de notificaciones</H3>
        <Ol>
          <li>Creá un grupo de Telegram para el equipo del negocio (ej. "Notificaciones El Fogón")</li>
          <li>Agregá tu bot a ese grupo</li>
          <li>Enviá cualquier mensaje en el grupo</li>
          <li>
            Abrí en el browser:{' '}
            <code>https://api.telegram.org/bot{'{TOKEN}'}/getUpdates</code>
            <br />
            (reemplazá <code>{'{TOKEN}'}</code> por el token del bot)
          </li>
          <li>Buscá el campo <code>chat.id</code> — va a ser un número negativo (ej. <code>-1001234567890</code>)</li>
        </Ol>

        <H3>5c — (Opcional) Canal de anuncios</H3>
        <P>
          Si querés enviar anuncios broadcast a un canal público de Telegram:
        </P>
        <Ol>
          <li>Creá un canal en Telegram (ej. "El Fogón de María")</li>
          <li>Agregá tu bot como <Strong>administrador</Strong> del canal</li>
          <li>
            El <Strong>Channel ID</Strong> del canal también se obtiene con <code>/getUpdates</code>
            o podés usar el username del canal (ej. <code>@elfogondemaria</code>)
          </li>
        </Ol>

        <H3>5d — Pegar los datos en el panel</H3>
        <P>
          Andá a <Strong>Configuración → Telegram</Strong> y completá:
        </P>
        <Ul>
          <li><Strong>Token del bot</Strong> — el que te dio BotFather</li>
          <li><Strong>Channel ID</Strong> — el canal de anuncios (opcional)</li>
          <li><Strong>Chat de notificaciones</Strong> — el grupo del equipo</li>
        </Ul>
        <P>Click en <Strong>"Guardar configuración"</Strong>.</P>

        <Note tone="warning">
          El token del bot es como una contraseña. No lo compartas ni lo postees en ningún lugar público.
          En el panel aparece como <code>••••••••</code> después de guardarlo.
        </Note>
        <CheckList>
          <CheckItem>Token guardado (aparece "Bot configurado ✓")</CheckItem>
          <CheckItem>El bot está en el grupo de notificaciones</CheckItem>
        </CheckList>
      </Step>

      {/* ─────────────────────────────────────────────────────── */}
      <H2 id="parte-2">Parte 2 — Flujo del cliente</H2>
      <P>
        Hacé esto desde el teléfono, idealmente con Telegram instalado. Simulá ser un cliente
        real que entra al catálogo por primera vez.
      </P>

      <Step n={6} title="Abrir el catálogo">
        <P>
          Abrí en el browser de tu teléfono:{' '}
          <Strong>tunegocio.colacero.com</Strong>
          <br />
          (reemplazá <code>tunegocio</code> por el slug que elegiste)
        </P>
        <CheckList>
          <CheckItem>El catálogo carga con el nombre del negocio</CheckItem>
          <CheckItem>Los productos aparecen con nombre, precio y foto</CheckItem>
          <CheckItem>Los filtros de categoría funcionan</CheckItem>
          <CheckItem>La búsqueda filtra los productos en tiempo real</CheckItem>
        </CheckList>
        <ScreenshotPlaceholder caption="Catálogo público en mobile" />
      </Step>

      <Step n={7} title="Agregar al carrito y revisar stock">
        <Ol>
          <li>Tocá un producto → botón <Strong>"Agregar"</Strong></li>
          <li>Cambiá la cantidad si hace falta</li>
          <li>Agregá 2–3 productos distintos</li>
          <li>Abrí el carrito (botón flotante con el número de ítems)</li>
        </Ol>
        <CheckList>
          <CheckItem>El carrito muestra los ítems con precio y cantidad</CheckItem>
          <CheckItem>El total se actualiza en tiempo real</CheckItem>
          <CheckItem>Si ponés más cantidad que el stock disponible, aparece aviso</CheckItem>
        </CheckList>
      </Step>

      <Step n={8} title="Iniciar sesión con Telegram (checkout paso 1)">
        <P>
          Desde el carrito, click en <Strong>"Confirmar pedido"</Strong>.
          Si ya estás dentro de Telegram (Mini App), este paso se salta automáticamente.
        </P>
        <P>Si estás en el browser normal:</P>
        <Ol>
          <li>Aparece el botón <Strong>"Iniciar sesión con Telegram"</Strong></li>
          <li>Click → Telegram se abre con una confirmación</li>
          <li>Confirmá → el checkout avanza solo al siguiente paso</li>
        </Ol>
        <Note tone="tip">
          En desktop aparece un QR para escanear con el teléfono. En mobile abre la app directamente.
        </Note>
        <CheckList>
          <CheckItem>El checkout avanza al paso de ventanas sin pedir nada más</CheckItem>
          <CheckItem>El nombre del cliente aparece en el encabezado</CheckItem>
        </CheckList>
      </Step>

      <Step n={9} title="Seleccionar ventana de recogida (checkout paso 2)">
        <Ol>
          <li>Elegí una ventana de las disponibles (fecha + horario + cupos)</li>
          <li>Podés agregar una <Strong>nota</Strong> para el negocio (ej. "Córtenme el pollo en presas")</li>
          <li>Click en <Strong>"Confirmar pedido"</Strong></li>
        </Ol>
        <CheckList>
          <CheckItem>Solo aparecen ventanas con cupos disponibles</CheckItem>
          <CheckItem>Al confirmar aparece el <Strong>código de recogida</Strong> (ej. <code>ABC-123</code>)</CheckItem>
          <CheckItem>La pantalla muestra resumen del pedido, ventana elegida y el código</CheckItem>
        </CheckList>
        <ScreenshotPlaceholder caption="Pantalla de confirmación con pickup code" />
      </Step>

      <Step n={10} title="Trackear el pedido">
        <P>
          Desde la pantalla de confirmación, click en <Strong>"Ver estado del pedido"</Strong>.
          También podés acceder directo a:{' '}
          <code>tunegocio.colacero.com/track/ABC-123</code>
        </P>
        <CheckList>
          <CheckItem>La página muestra el estado actual: <Strong>Confirmado</Strong></CheckItem>
          <CheckItem>La página se actualiza cada 30 segundos automáticamente</CheckItem>
        </CheckList>
      </Step>

      {/* ─────────────────────────────────────────────────────── */}
      <H2 id="parte-3">Parte 3 — Atender el pedido (panel)</H2>
      <P>Volvé al panel y validá que todo llegó correctamente.</P>

      <Step n={11} title="Recibir notificación de Telegram">
        <P>
          Si configuraste el bot en el Paso 5, el grupo del equipo debería haber recibido
          un mensaje automático con el resumen del pedido.
        </P>
        <CheckList>
          <CheckItem>El mensaje llega al grupo con: número de pedido, cliente, ítems, ventana y código</CheckItem>
          <CheckItem>Si no llegó: verificá que el bot está en el grupo y que el Chat ID es correcto</CheckItem>
        </CheckList>
      </Step>

      <Step n={12} title="Ver el pedido en el panel">
        <Ol>
          <li>Andá a <Strong>Pedidos</Strong> en el panel</li>
          <li>El pedido aparece en la columna <Strong>"Confirmado"</Strong> del kanban</li>
          <li>Click en el pedido para ver el detalle: ítems, notas, cliente, ventana</li>
        </Ol>
        <CheckList>
          <CheckItem>El pedido aparece en tiempo real (sin recargar la página)</CheckItem>
          <CheckItem>La nota del cliente es visible</CheckItem>
        </CheckList>
        <ScreenshotPlaceholder caption="Kanban de pedidos con el nuevo pedido" />
      </Step>

      <Step n={13} title="Mover el pedido por los estados">
        <P>El flujo de estados es: <Strong>Confirmado → En preparación → Listo → Entregado</Strong></P>
        <Ol>
          <li>Arrastrá el pedido a <Strong>"En preparación"</Strong> cuando empezás a prepararlo</li>
          <li>Cuando está listo, movelo a <Strong>"Listo"</Strong></li>
          <li>
            El cliente recibe una notificación automática por Telegram cuando el pedido pasa a Listo
          </li>
          <li>Cuando el cliente viene a buscar, pedile el código → verificá → movelo a <Strong>"Entregado"</Strong></li>
        </Ol>
        <CheckList>
          <CheckItem>El cliente recibe DM de Telegram cuando el pedido pasa a "Listo"</CheckItem>
          <CheckItem>El estado en la página de tracking cambia en tiempo real</CheckItem>
          <CheckItem>Después de marcar "Entregado", el stock se descuenta automáticamente</CheckItem>
        </CheckList>
      </Step>

      {/* ─────────────────────────────────────────────────────── */}
      <H2 id="parte-4">Parte 4 — Anuncios al canal</H2>
      <P>Probá enviar un anuncio a tu canal de Telegram.</P>

      <Step n={14} title="Crear y enviar un anuncio">
        <Ol>
          <li>Andá a <Strong>Anuncios</Strong> en el panel</li>
          <li>Elegí una plantilla (ej. <Strong>"📅 Productos del día"</Strong>)</li>
          <li>Seleccioná los productos que querés destacar</li>
          <li>Editá el texto si hace falta</li>
          <li>Click en <Strong>"🎨 Generar imagen"</Strong> para crear el flyer PNG automáticamente</li>
          <li>Click en <Strong>"Publicar ahora"</Strong></li>
        </Ol>
        <CheckList>
          <CheckItem>El anuncio aparece en el canal con imagen y botón "Ver catálogo"</CheckItem>
          <CheckItem>El botón del anuncio abre el catálogo directamente</CheckItem>
          <CheckItem>En el historial de anuncios aparece con estado <Strong>SENT</Strong></CheckItem>
        </CheckList>
        <Note tone="info">
          Si no tenés canal de Telegram configurado, el botón "Publicar ahora" va a aparecer deshabilitado.
          Completá el Canal ID en Configuración → Telegram primero.
        </Note>
        <ScreenshotPlaceholder caption="Anuncio enviado al canal con imagen y botón" />
      </Step>

      {/* ─────────────────────────────────────────────────────── */}
      <H2 id="parte-5">Parte 5 — Dashboard y métricas</H2>

      <Step n={15} title="Revisar el dashboard">
        <P>Andá a <Strong>Dashboard</Strong> para verificar que los datos se registraron.</P>
        <CheckList>
          <CheckItem>El KPI "Pedidos de hoy" muestra al menos 1</CheckItem>
          <CheckItem>Los ingresos del día reflejan el total del pedido de prueba</CheckItem>
          <CheckItem>En "Top productos" aparece lo que pediste</CheckItem>
          <CheckItem>Si bajaste el stock por debajo del mínimo, aparece en "Alertas de stock"</CheckItem>
        </CheckList>
        <ScreenshotPlaceholder caption="Dashboard con KPIs no-cero después de la prueba" />
      </Step>

      {/* ─────────────────────────────────────────────────────── */}
      <H2 id="checklist-final">Checklist final</H2>
      <P>
        Antes de compartir el catálogo con tus primeros clientes, verificá que todos estos
        puntos estén en verde:
      </P>

      <CheckList>
        <CheckItem status="todo">Cuenta creada y email verificado</CheckItem>
        <CheckItem status="todo">Al menos 5 productos activos con stock mayor a 0</CheckItem>
        <CheckItem status="todo">Ventanas de recogida configuradas para los próximos días</CheckItem>
        <CheckItem status="todo">Bot de Telegram configurado (token + chat de notificaciones)</CheckItem>
        <CheckItem status="todo">Pedido de prueba completado end-to-end</CheckItem>
        <CheckItem status="todo">Notificación de Telegram llegó al grupo del equipo</CheckItem>
        <CheckItem status="todo">DM de "Pedido listo" llegó al cliente (vos) cuando moviste a Listo</CheckItem>
        <CheckItem status="todo">Anuncio de prueba enviado al canal (si tenés canal)</CheckItem>
        <CheckItem status="todo">Dashboard muestra datos del pedido de prueba</CheckItem>
      </CheckList>

      <Note tone="tip">
        <Strong>¿Algo no funciona?</Strong> Escribinos por Telegram a{' '}
        <a href="https://t.me/Arielhechavarria" target="_blank" rel="noopener noreferrer" className="underline">
          @Arielhechavarria
        </a>{' '}
        con una captura de pantalla del error y lo resolvemos en minutos.
      </Note>

      <PrevNext
        prev={{ href: '/manual/configuracion', label: 'Configuración' }}
      />
    </>
  )
}
