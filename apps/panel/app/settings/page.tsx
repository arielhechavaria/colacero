'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getMe,
  getBusinessProfile,
  updateBusinessProfile,
  getStaff,
  createStaff,
  deleteStaff,
  changePassword,
  TIMEZONES,
  type BusinessProfile,
  type StaffMember,
  type CurrentUser,
} from '../../lib/api'

// ── Shared UI ─────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
      {children}
    </label>
  )
}

function GlassInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
      style={{
        background: 'var(--glass-bg)',
        border:     '1px solid var(--glass-border)',
        color:      'var(--text)',
      }}
    />
  )
}

function GlassSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none appearance-none"
      style={{
        background: 'var(--glass-bg)',
        border:     '1px solid var(--glass-border)',
        color:      'var(--text)',
      }}
    />
  )
}

function SaveBtn({ loading, label = 'Guardar' }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white bg-gradient-teal-violet shadow-glow disabled:opacity-50 transition-opacity"
    >
      {loading ? 'Guardando…' : label}
    </button>
  )
}

function Toast({ msg, type }: { msg: string; type: 'ok' | 'error' }) {
  const bg  = type === 'ok' ? 'rgba(99,102,241,0.1)'  : 'rgba(248,113,113,0.08)'
  const col = type === 'ok' ? '#818CF8'               : 'var(--error)'
  const brd = type === 'ok' ? 'rgba(99,102,241,0.3)'  : 'rgba(248,113,113,0.2)'
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{ background: bg, color: col, border: `1px solid ${brd}` }}
    >
      {msg}
    </div>
  )
}

// ── Tab: Negocio ──────────────────────────────────────────────────────────────

function BusinessTab({ token, isOwner }: { token: string; isOwner: boolean }) {
  const [profile,  setProfile]  = useState<BusinessProfile | null>(null)
  const [form,     setForm]     = useState({ name: '', description: '', timezone: '' })
  const [saving,   setSaving]   = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; type: 'ok' | 'error' } | null>(null)

  useEffect(() => {
    getBusinessProfile(token)
      .then((p) => {
        setProfile(p)
        setForm({ name: p.name, description: p.description ?? '', timezone: p.timezone })
      })
      .catch(() => setFeedback({ msg: 'Error al cargar perfil', type: 'error' }))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      const updated = await updateBusinessProfile(token, {
        name:        form.name.trim(),
        description: form.description.trim() || null,
        timezone:    form.timezone,
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
    return <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>Cargando…</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {feedback && <Toast {...feedback} />}

      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <FieldLabel>Nombre del negocio</FieldLabel>
          <GlassInput
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="El Fogón ColaCero"
            disabled={!isOwner}
            required
          />
        </div>

        <div>
          <FieldLabel>Descripción</FieldLabel>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Breve descripción del negocio…"
            rows={3}
            disabled={!isOwner}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
            style={{
              background: 'var(--glass-bg)',
              border:     '1px solid var(--glass-border)',
              color:      'var(--text)',
            }}
          />
        </div>

        <div>
          <FieldLabel>Zona horaria</FieldLabel>
          <GlassSelect
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
          <p className="text-xs flex-1" style={{ color: 'var(--muted)' }}>
            Slug: <span className="font-mono">{profile.slug}</span>
            {' · '}Plan: <span className="font-semibold">{profile.subscriptionStatus}</span>
          </p>
          {isOwner && <SaveBtn loading={saving} />}
        </div>

        {!isOwner && (
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
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
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--muted)' }}>Cargando…</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
            {staff.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{u.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {u.role}
                    {u.id === currentUserId && ' · tú'}
                  </p>
                </div>
                {isOwner && u.id !== currentUserId && (
                  <button
                    onClick={() => void handleDelete(u.id, u.email)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    style={{ color: 'var(--error)', background: 'rgba(248,113,113,0.08)' }}
                  >
                    Eliminar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add member */}
      {isOwner && (
        showForm ? (
          <form onSubmit={handleAdd} className="glass rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Nuevo miembro</p>
            <div>
              <FieldLabel>Email</FieldLabel>
              <GlassInput
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="staff@negocio.com"
                required
              />
            </div>
            <div>
              <FieldLabel>Contraseña inicial</FieldLabel>
              <GlassInput
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
              />
            </div>
            <div>
              <FieldLabel>Rol</FieldLabel>
              <GlassSelect
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as 'OWNER' | 'STAFF' }))}
              >
                <option value="STAFF">Staff</option>
                <option value="OWNER">Owner</option>
              </GlassSelect>
            </div>
            <div className="flex gap-2 pt-1">
              <SaveBtn loading={saving} label="Agregar miembro" />
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold"
                style={{ color: 'var(--muted)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-gradient-teal-violet shadow-glow w-full"
          >
            + Agregar miembro del equipo
          </button>
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

      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <FieldLabel>Contraseña actual</FieldLabel>
          <GlassInput
            type="password"
            value={form.current}
            onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
            required
          />
        </div>
        <div>
          <FieldLabel>Nueva contraseña</FieldLabel>
          <GlassInput
            type="password"
            value={form.next}
            onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            required
          />
        </div>
        <div>
          <FieldLabel>Confirmar nueva contraseña</FieldLabel>
          <GlassInput
            type="password"
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            minLength={8}
            required
          />
        </div>
        <div className="pt-1">
          <SaveBtn loading={saving} label="Cambiar contraseña" />
        </div>
      </div>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'business' | 'staff' | 'password'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'business', label: 'Negocio',     icon: '🏪' },
  { key: 'staff',    label: 'Equipo',      icon: '👥' },
  { key: 'password', label: 'Contraseña',  icon: '🔑' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [tab,         setTab]         = useState<Tab>('business')
  const [token,       setToken]       = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const tok = sessionStorage.getItem('panel_token')
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
        className="sticky top-0 z-10 glass px-6 py-4"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-gradient">Configuración</h1>
          {currentUser && (
            <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
              {currentUser.email} · {currentUser.role}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={
                tab === key
                  ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff' }
                  : { color: 'var(--muted)', background: 'transparent' }
              }
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6 py-5 max-w-2xl">
        {loading || !token || !currentUser ? (
          <div className="flex items-center justify-center py-20">
            <p style={{ color: 'var(--muted)' }}>Cargando…</p>
          </div>
        ) : (
          <>
            {tab === 'business' && (
              <BusinessTab token={token} isOwner={isOwner} />
            )}
            {tab === 'staff' && (
              <StaffTab token={token} currentUserId={currentUser.id} isOwner={isOwner} />
            )}
            {tab === 'password' && (
              <PasswordTab token={token} />
            )}
          </>
        )}
      </div>
    </main>
  )
}
