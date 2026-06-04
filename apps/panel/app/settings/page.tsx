'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getMe,
  getBusinessProfile,
  updateBusinessProfile,
  getStaff,
  createStaff,
  deleteStaff,
  changePassword,
  getTelegramSettings,
  updateTelegramSettings,
  TIMEZONES,
  type BusinessProfile,
  type StaffMember,
  type CurrentUser,
  type TelegramSettings,
  isAuthenticatedClient, } from '../../lib/api'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// ── Shared UI ─────────────────────────────────────────────────────────────────

// GlassSelect has no Shadcn equivalent — keep it as is
function GlassSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none appearance-none bg-white border border-white/[0.08] text-white"
    />
  )
}

function Toast({ msg, type }: { msg: string; type: 'ok' | 'error' }) {
  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm ${type === 'ok' ? 'bg-indigo-50 text-indigo-500 border border-indigo-200' : 'bg-red-50 text-red-600 border border-red-200'}`}
    >
      {msg}
    </div>
  )
}

// ── Tab: Negocio ──────────────────────────────────────────────────────────────

function BusinessTab({ token, isOwner }: { token: string; isOwner: boolean }) {
  const [profile,  setProfile]  = useState<BusinessProfile | null>(null)
  const [form,     setForm]     = useState({ name: '', description: '', timezone: '', address: '', latitude: '', longitude: '' })
  const [saving,   setSaving]   = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; type: 'ok' | 'error' } | null>(null)

  useEffect(() => {
    getBusinessProfile(token)
      .then((p) => {
        setProfile(p)
        setForm({
          name:      p.name,
          description: p.description ?? '',
          timezone:  p.timezone,
          address:   p.address   ?? '',
          latitude:  p.latitude  != null ? String(p.latitude)  : '',
          longitude: p.longitude != null ? String(p.longitude) : '',
        })
      })
      .catch(() => setFeedback({ msg: 'Error al cargar perfil', type: 'error' }))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      const lat = parseFloat(form.latitude)
      const lon = parseFloat(form.longitude)
      const updated = await updateBusinessProfile(token, {
        name:        form.name.trim(),
        description: form.description.trim() || null,
        timezone:    form.timezone,
        address:     form.address.trim() || null,
        latitude:    isNaN(lat) ? null : lat,
        longitude:   isNaN(lon) ? null : lon,
      })
      setProfile(updated)
      setFeedback({ msg: 'Perfil actualizado ✓', type: 'ok' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'error'
      setFeedback({ msg: msg === 'owner_only' ? 'Solo el OWNER puede editar esto' : 'Error al guardar', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return <p className="text-sm py-8 text-center text-slate-500">Cargando…</p>
  }

  // Catalog URL — same host, port 3001 (or NEXT_PUBLIC_CATALOG_URL if set)
  const catalogUrl = typeof window !== 'undefined'
    ? (process.env['NEXT_PUBLIC_CATALOG_URL'] ?? window.location.origin.replace(':3002', ':3001')) + `/${profile.slug}`
    : `/${profile.slug}`

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(catalogUrl)}&color=00D4BE&bgcolor=0B0F1A&qzone=1`

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {feedback && <Toast {...feedback} />}

      {/* ── QR del catálogo ── */}
      <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] shadow-lg p-5">
        <p className="text-sm font-semibold mb-1 text-white">
          Código QR del catálogo
        </p>
        <p className="text-xs mb-4 text-slate-500">
          Compartilo con tus clientes o imprimilo en el local
        </p>
        <div className="flex items-start gap-5 flex-wrap">
          {/* QR image */}
          <div
            className="rounded-xl overflow-hidden flex-shrink-0"
            style={{ background: '#0B0F1A', padding: '8px' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="QR catálogo" width={180} height={180} />
          </div>
          {/* URL + copy */}
          <div className="flex flex-col gap-3 flex-1 min-w-0 justify-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-slate-500">
                Link del catálogo
              </p>
              <p
                className="text-sm font-mono break-all rounded-lg px-3 py-2 bg-[#0B0F1A] text-indigo-400 border border-white/[0.08]"
              >
                {catalogUrl}
              </p>
            </div>
            <Button
              type="button"
              className="w-fit bg-gradient-teal-violet shadow-glow hover:opacity-90"
              onClick={() => void navigator.clipboard.writeText(catalogUrl)}
            >
              Copiar link
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] shadow-lg p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="biz-name">Nombre del negocio</Label>
          <Input
            id="biz-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="El Fogón ColaCero"
            disabled={!isOwner}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="biz-desc">Descripción</Label>
          <Textarea
            id="biz-desc"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Breve descripción del negocio…"
            rows={3}
            disabled={!isOwner}
            className="resize-none"
          />
        </div>

        {/* Ubicación del negocio */}
        <div className="flex flex-col gap-3 pt-1">
          <div>
            <p className="text-sm font-semibold text-white">Ubicación</p>
            <p className="text-xs mt-0.5 text-slate-500">
              Tus clientes verán un botón "📍 Cómo llegar" en el catálogo.{' '}
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-indigo-400"
              >
                Abrí Google Maps
              </a>
              , click derecho en tu local → "¿Qué hay aquí?" y copiá los números.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="biz-address">Dirección</Label>
            <Input
              id="biz-address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Ej: Calle 23 #456, Vedado, La Habana"
              disabled={!isOwner}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <Label htmlFor="biz-lat">Latitud</Label>
              <Input
                id="biz-lat"
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                placeholder="Ej: 23.1329"
                className="font-mono"
                disabled={!isOwner}
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <Label htmlFor="biz-lon">Longitud</Label>
              <Input
                id="biz-lon"
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                placeholder="Ej: -82.3666"
                className="font-mono"
                disabled={!isOwner}
              />
            </div>
          </div>

          {/* Preview link si ya hay coords */}
          {form.latitude && form.longitude && !isNaN(parseFloat(form.latitude)) && !isNaN(parseFloat(form.longitude)) && (
            <a
              href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs w-fit rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80 bg-[#0B0F1A] border border-white/[0.08] text-indigo-400"
            >
              📍 Ver ubicación en Maps
            </a>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="biz-tz">Zona horaria</Label>
          <GlassSelect
            id="biz-tz"
            value={form.timezone}
            onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            disabled={!isOwner}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </GlassSelect>
        </div>

        <div className="pt-1 flex items-center gap-3">
          <p className="text-xs flex-1 text-slate-500">
            Slug: <span className="font-mono">{profile.slug}</span>
            {' · '}Plan: <span className="font-semibold">{profile.subscriptionStatus}</span>
          </p>
          {isOwner && (
            <Button type="submit" disabled={saving} className="bg-gradient-teal-violet shadow-glow hover:opacity-90">
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          )}
        </div>

        {!isOwner && (
          <p className="text-xs text-slate-500">
            Solo el OWNER puede editar el perfil del negocio.
          </p>
        )}
      </div>
    </form>
  )
}

// ── Tab: Staff ────────────────────────────────────────────────────────────────

function StaffTab({ token, currentUserId, isOwner }: { token: string; currentUserId: string; isOwner: boolean }) {
  const [staff,    setStaff]    = useState<StaffMember[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ email: '', password: '', role: 'STAFF' as 'OWNER' | 'STAFF' })
  const [saving,   setSaving]   = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; type: 'ok' | 'error' } | null>(null)

  const loadStaff = useCallback(() => {
    setLoading(true)
    getStaff(token)
      .then(setStaff)
      .catch(() => setFeedback({ msg: 'Error al cargar equipo', type: 'error' }))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => { loadStaff() }, [loadStaff])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      await createStaff(token, { email: form.email, password: form.password, role: form.role })
      setFeedback({ msg: 'Miembro agregado ✓', type: 'ok' })
      setForm({ email: '', password: '', role: 'STAFF' })
      setShowForm(false)
      loadStaff()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'error'
      setFeedback({
        msg:  msg === 'email_already_exists' ? 'Ese email ya existe' : 'Error al agregar miembro',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(userId: string, email: string) {
    if (!confirm(`¿Eliminar a ${email}? Esta acción no se puede deshacer.`)) return
    try {
      await deleteStaff(token, userId)
      setStaff((prev) => prev.filter((u) => u.id !== userId))
      setFeedback({ msg: 'Miembro eliminado', type: 'ok' })
    } catch {
      setFeedback({ msg: 'Error al eliminar miembro', type: 'error' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {feedback && <Toast {...feedback} />}

      {/* Staff list */}
      <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] shadow-lg overflow-hidden">
        {loading ? (
          <p className="text-sm py-8 text-center text-slate-500">Cargando…</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {staff.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{u.email}</p>
                  <p className="text-xs mt-0.5 text-slate-500">
                    {u.role}
                    {u.id === currentUserId && ' · tú'}
                  </p>
                </div>
                {isOwner && u.id !== currentUserId && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleDelete(u.id, u.email)}
                  >
                    Eliminar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add member */}
      {isOwner && (
        showForm ? (
          <form onSubmit={handleAdd} className="bg-white/[0.04] rounded-xl border border-white/[0.08] shadow-lg p-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-white">Nuevo miembro</p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="staff@negocio.com"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-pass">Contraseña inicial</Label>
              <Input
                id="staff-pass"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-role">Rol</Label>
              <GlassSelect
                id="staff-role"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as 'OWNER' | 'STAFF' }))}
              >
                <option value="STAFF">Staff</option>
                <option value="OWNER">Owner</option>
              </GlassSelect>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={saving} className="bg-gradient-teal-violet shadow-glow hover:opacity-90">
                {saving ? 'Guardando…' : 'Agregar miembro'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <Button
            className="w-full bg-gradient-teal-violet shadow-glow hover:opacity-90"
            onClick={() => setShowForm(true)}
          >
            + Agregar miembro del equipo
          </Button>
        )
      )}
    </div>
  )
}

// ── Tab: Contraseña ───────────────────────────────────────────────────────────

function PasswordTab({ token }: { token: string }) {
  const [form,     setForm]     = useState({ current: '', next: '', confirm: '' })
  const [saving,   setSaving]   = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; type: 'ok' | 'error' } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.next !== form.confirm) {
      setFeedback({ msg: 'Las contraseñas no coinciden', type: 'error' })
      return
    }
    setSaving(true)
    setFeedback(null)
    try {
      await changePassword(token, form.current, form.next)
      setFeedback({ msg: 'Contraseña actualizada ✓', type: 'ok' })
      setForm({ current: '', next: '', confirm: '' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'error'
      setFeedback({
        msg:  msg === 'wrong_password' ? 'La contraseña actual es incorrecta' : 'Error al cambiar contraseña',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {feedback && <Toast {...feedback} />}

      <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] shadow-lg p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pwd-current">Contraseña actual</Label>
          <Input
            id="pwd-current"
            type="password"
            value={form.current}
            onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pwd-next">Nueva contraseña</Label>
          <Input
            id="pwd-next"
            type="password"
            value={form.next}
            onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pwd-confirm">Confirmar nueva contraseña</Label>
          <Input
            id="pwd-confirm"
            type="password"
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            minLength={8}
            required
          />
        </div>
        <div className="pt-1">
          <Button type="submit" disabled={saving} className="bg-gradient-teal-violet shadow-glow hover:opacity-90">
            {saving ? 'Guardando…' : 'Cambiar contraseña'}
          </Button>
        </div>
      </div>
    </form>
  )
}

// ── Tab: Telegram ─────────────────────────────────────────────────────────────

function TelegramTab({ token, isOwner }: { token: string; isOwner: boolean }) {
  const [settings, setSettings] = useState<TelegramSettings | null>(null)
  const [form,     setForm]     = useState({ botToken: '', channelId: '', notifyChatId: '' })
  const [saving,   setSaving]   = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; type: 'ok' | 'error' } | null>(null)

  useEffect(() => {
    getTelegramSettings()
      .then((s) => {
        setSettings(s)
        setForm({
          botToken:     '',  // write-only — never pre-fill
          channelId:    s.channelId    ?? '',
          notifyChatId: s.notifyChatId ?? '',
        })
      })
      .catch(() => setFeedback({ msg: 'Error al cargar configuración Telegram', type: 'error' }))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      const payload: Parameters<typeof updateTelegramSettings>[0] = {}
      if (form.botToken.trim())     payload.botToken     = form.botToken.trim()
      if (form.channelId !== undefined)    payload.channelId    = form.channelId.trim()    || null
      if (form.notifyChatId !== undefined) payload.notifyChatId = form.notifyChatId.trim() || null

      await updateTelegramSettings(payload)

      // Reload to reflect hasBotToken change
      const updated = await getTelegramSettings()
      setSettings(updated)
      setForm((f) => ({ ...f, botToken: '' }))
      setFeedback({ msg: 'Configuración Telegram actualizada ✓', type: 'ok' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'error'
      setFeedback({
        msg:  msg === 'owner_only' ? 'Solo el OWNER puede editar esto' : 'Error al guardar',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!settings) {
    return <p className="text-sm py-8 text-center text-slate-500">Cargando…</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {feedback && <Toast {...feedback} />}

      <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] shadow-lg p-5 flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-white">Bot de Telegram</p>
          <p className="text-xs mt-1 text-slate-500">
            Creá un bot en{' '}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-indigo-400"
            >
              @BotFather
            </a>
            {' '}y pegá el token acá. El token nunca se muestra una vez guardado.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tg-token">
            Token del bot
            {settings.hasBotToken && (
              <span className="ml-2 text-xs font-normal text-indigo-400">
                (ya configurado — dejá vacío para no cambiar)
              </span>
            )}
          </Label>
          <Input
            id="tg-token"
            type="password"
            value={form.botToken}
            onChange={(e) => setForm((f) => ({ ...f, botToken: e.target.value }))}
            placeholder="Pegá el token de @BotFather"
            disabled={!isOwner}
            autoComplete="new-password"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tg-channel">ID del canal de anuncios</Label>
          <p className="text-xs text-slate-500">
            Canal donde se publican los anuncios (ej. promos, disponibilidad).
            Usá el username (@mi_canal) o el ID numérico (-100xxxxxxxxx).
          </p>
          <Input
            id="tg-channel"
            value={form.channelId}
            onChange={(e) => setForm((f) => ({ ...f, channelId: e.target.value }))}
            placeholder="@mi_canal o -100xxxxx"
            disabled={!isOwner}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tg-notif">ID del grupo de notificaciones</Label>
          <p className="text-xs text-slate-500">
            Grupo interno donde el bot avisa cuando llega un pedido nuevo.
            Usá el username (@mi_grupo) o el ID numérico (-100xxxxxxxxx).
          </p>
          <Input
            id="tg-notif"
            value={form.notifyChatId}
            onChange={(e) => setForm((f) => ({ ...f, notifyChatId: e.target.value }))}
            placeholder="@mi_grupo o -100xxxxx"
            disabled={!isOwner}
          />
        </div>

        {isOwner ? (
          <div className="pt-1">
            <Button type="submit" disabled={saving} className="bg-gradient-teal-violet shadow-glow hover:opacity-90">
              {saving ? 'Guardando…' : 'Guardar configuración Telegram'}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Solo el OWNER puede editar la configuración de Telegram.
          </p>
        )}
      </div>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'business' | 'staff' | 'password' | 'telegram'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'business', label: 'Negocio',     icon: '🏪' },
  { key: 'staff',    label: 'Equipo',      icon: '👥' },
  { key: 'password', label: 'Contraseña',  icon: '🔑' },
  { key: 'telegram', label: 'Telegram',    icon: '✈️' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [tab,         setTab]         = useState<Tab>('business')
  const [token,       setToken]       = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const tok = (isAuthenticatedClient() ? '1' : null)
    if (!tok) { router.replace('/login'); return }
    setToken(tok)
    getMe(tok)
      .then(setCurrentUser)
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false))
  }, [router])

  const isOwner = currentUser?.role === 'OWNER'

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-6 py-5 border-b border-white/[0.08] bg-white flex items-center justify-between"
      >
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-gradient">Configuración</h1>
          {currentUser && (
            <span className="text-xs font-mono text-slate-500">
              {currentUser.email} · {currentUser.role}
            </span>
          )}
        </div>

          {/* Tabs — mobile only */}
        <div className="flex gap-1 mt-3 lg:hidden">
          {TABS.map(({ key, label, icon }) => (
            <Button
              key={key}
              size="sm"
              variant={tab === key ? 'default' : 'ghost'}
              onClick={() => setTab(key)}
            >
              {icon} {label}
            </Button>
          ))}
        </div>
      </header>

      {loading || !token || !currentUser ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-500">Cargando…</p>
        </div>
      ) : (
        <div className="px-6 py-5 lg:grid lg:grid-cols-[200px_1fr] lg:gap-6 lg:items-start">

          {/* Sidebar — desktop only */}
          <nav className="hidden lg:flex flex-col gap-1 bg-white/[0.04] rounded-xl border border-white/[0.08] shadow-lg p-3">
            {TABS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-left transition-colors ${tab === key ? 'bg-indigo-500/15 text-indigo-400 font-semibold' : 'text-white'}`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div>
            {tab === 'business' && (
              <BusinessTab token={token} isOwner={isOwner} />
            )}
            {tab === 'staff' && (
              <StaffTab token={token} currentUserId={currentUser.id} isOwner={isOwner} />
            )}
            {tab === 'password' && (
              <PasswordTab token={token} />
            )}
            {tab === 'telegram' && (
              <TelegramTab token={token} isOwner={isOwner} />
            )}
          </div>

        </div>
      )}
    </main>
  )
}