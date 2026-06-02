import { H1, Lead, H2, P, Strong, Ol, Ul, Note, ScreenshotPlaceholder, PrevNext } from '../../../components/doc-components'

export const metadata = { title: 'Empezar' }

export default function EmpezarPage() {
  return (
    <>
      <H1>Empezar</H1>
      <Lead>
        Cómo hacer el primer login después de que te demos de alta y cómo verificar tu email.
      </Lead>

      <H2 id="crear-cuenta">1. Crear tu cuenta</H2>
      <P>
        Entrá a{' '}
        <a href="https://panel.colacero.com/signup" className="underline">panel.colacero.com/signup</a>{' '}
        y completá el formulario:
      </P>
      <Ul>
        <li><Strong>Nombre del negocio</Strong> — el que ven tus clientes en el catálogo</li>
        <li><Strong>URL del catálogo</Strong> — se genera automático desde el nombre; podés editarla</li>
        <li><Strong>Email</Strong> y <Strong>contraseña</Strong> (mínimo 10 caracteres)</li>
      </Ul>
      <P>
        Al enviar el formulario, quedás logueado automáticamente y aterrizás en el dashboard.
      </P>
      <ScreenshotPlaceholder caption="Formulario de signup" />

      <Note tone="tip">
        La URL de tu catálogo (<code>tunegocio.colacero.com</code>) se elige al momento del registro
        y no se puede cambiar después desde el panel. Elegí algo corto, sin tildes y fácil de recordar.
      </Note>

      <H2 id="primer-login">2. Primer login (si ya tenés cuenta)</H2>
      <P>
        Entrá a <a href="https://panel.colacero.com/login" className="underline">panel.colacero.com</a> y poné tu email + contraseña.
      </P>
      <ScreenshotPlaceholder caption="Pantalla de login del panel" />

      <Note tone="tip">
        Si olvidás tu contraseña, click en <Strong>"¿Olvidaste tu contraseña?"</Strong> en la pantalla
        de login. Recibís un email con un link válido por 60 minutos.
      </Note>

      <H2 id="verificar-email">3. Verificar tu email</H2>
      <P>
        Después del primer login vas a ver un banner amarillo arriba pidiéndote verificar tu email.
        No es obligatorio, pero te lo recomendamos para poder recuperar tu cuenta si perdés acceso.
      </P>
      <Ol>
        <li>Click en <Strong>"Reenviar email"</Strong> en el banner</li>
        <li>Buscá el email en tu casilla (puede tardar 1–2 minutos)</li>
        <li>Click en el link → email queda verificado, banner desaparece</li>
      </Ol>

      <H2 id="explorar">4. Explorar el panel</H2>
      <P>
        En la barra lateral izquierda vas a encontrar:
      </P>
      <Ul>
        <li><Strong>Dashboard</Strong>: KPIs y métricas del período</li>
        <li><Strong>Pedidos</Strong>: vista kanban con todas las órdenes</li>
        <li><Strong>Cola de prep.</Strong>: lo que tenés que preparar ahora</li>
        <li><Strong>Ventanas</Strong>: horarios de recogida</li>
        <li><Strong>Productos</Strong>: catálogo + inventario</li>
        <li><Strong>Clientes</Strong>: CRM con historial</li>
        <li><Strong>Anuncios</Strong>: broadcast a Telegram</li>
        <li><Strong>Config</Strong>: perfil, staff, seguridad</li>
      </Ul>

      <PrevNext
        prev={{ href: '/manual', label: 'Introducción' }}
        next={{ href: '/manual/productos', label: 'Productos' }}
      />
    </>
  )
}
