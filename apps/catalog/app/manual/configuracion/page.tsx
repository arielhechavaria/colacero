import { H1, Lead, H2, P, Strong, Ul, Ol, Note, ScreenshotPlaceholder, PrevNext } from '../../../components/doc-components'

export const metadata = { title: 'Configuración' }

export default function ConfiguracionPage() {
  return (
    <>
      <H1>Configuración</H1>
      <Lead>
        Tres bloques en <Strong>Configuración</Strong>: perfil del negocio, staff y seguridad.
      </Lead>

      <H2 id="negocio">Perfil del negocio</H2>
      <P>
        Acá podés cambiar:
      </P>
      <Ul>
        <li><Strong>Nombre</Strong> — el que ven tus clientes en el catálogo</li>
        <li><Strong>Descripción</Strong> — texto breve que aparece debajo del nombre</li>
        <li><Strong>Zona horaria</Strong> — afecta las fechas que ven los clientes</li>
      </Ul>
      <Note tone="info">
        El <Strong>slug</Strong> (tu subdominio) no se puede cambiar desde el panel. Si necesitás
        cambiarlo, escribinos por Telegram.
      </Note>

      <H2 id="staff">Staff</H2>
      <P>
        Podés agregar otros usuarios que tengan acceso al panel. Hay dos roles:
      </P>
      <Ul>
        <li><Strong>OWNER</Strong>: acceso total, puede agregar/quitar staff</li>
        <li><Strong>STAFF</Strong>: acceso al panel pero sin permiso de gestionar otros usuarios</li>
      </Ul>
      <P>Para agregar:</P>
      <Ol>
        <li>Click en <Strong>"+ Agregar staff"</Strong></li>
        <li>Email + contraseña inicial + rol</li>
        <li>Le pasás las credenciales al miembro del equipo</li>
        <li>Ellos pueden cambiar su password en <Strong>Seguridad</Strong></li>
      </Ol>
      <ScreenshotPlaceholder caption="Sección de gestión de staff" />

      <H2 id="seguridad">Seguridad</H2>
      <P>
        Acá podés cambiar tu contraseña. Necesitás la actual + la nueva (mínimo 8 caracteres).
      </P>
      <Note tone="warning">
        Si olvidaste tu contraseña, no podés cambiarla desde acá (necesitás la actual). Usá el flow
        de "¿Olvidaste tu contraseña?" desde la pantalla de login.
      </Note>

      <PrevNext
        prev={{ href: '/manual/analytics', label: 'Analytics' }}
      />
    </>
  )
}
