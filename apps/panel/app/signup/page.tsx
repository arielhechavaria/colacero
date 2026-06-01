'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { registerBusiness, checkSlugAvailable } from '../../lib/api'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { Logo }   from '@/components/logo'

const SLUG_RE = /^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?$/

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32)
}

export default function SignupPage() {
  const router = useRouter()

  const [businessName, setBusinessName] = useState('')
  const [slug,         setSlug]         = useState('')
  const [slugEdited,   setSlugEdited]   = useState(false)
  const [ownerName,    setOwnerName]    = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [confirm,      setConfirm]      = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle')
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-generar slug desde el nombre del negocio
  useEffect(() => {
    if (!slugEdited && businessName) {
      setSlug(slugify(businessName))
    }
  }, [businessName, slugEdited])

  // Verificación de disponibilidad del slug (debounced 500ms)
  useEffect(() => {
    if (!slug) { setSlugStatus('idle'); return }

    if (!SLUG_RE.test(slug) || slug.length < 3) {
      setSlugStatus('invalid')
      return
    }

    setSlugStatus('checking')
    if (slugTimer.current) clearTimeout(slugTimer.current)
    slugTimer.current = setTimeout(() => {
      void checkSlugAvailable(slug).then((available) => {
        setSlugStatus(available ? 'ok' : 'taken')
      }).catch(() => setSlugStatus('idle'))
    }, 800)

    return () => { if (slugTimer.current) clearTimeout(slugTimer.current) }
  }, [slug])

  function slugHint() {
    if (slugStatus === 'checking') return '⏳ Verificando…'
    if (slugStatus === 'ok')       return `✅ Disponible · ${slug}.colacero.com`
    if (slugStatus === 'taken')    return '❌ Ya está en uso, elegí otro'
    if (slugStatus === 'invalid')  return '❌ Solo letras minúsculas, números y guiones (mín. 3)'
    if (slug) return `Tu catálogo: ${slug}.colacero.com`
    return 'Se genera automáticamente desde el nombre'
  }

  function slugHintColor() {
    if (slugStatus === 'ok')                                return '#22c55e'
    if (slugStatus === 'taken' || slugStatus === 'invalid') return 'var(--error)'
    return 'var(--muted)'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm)  { setError('Las contraseñas no coinciden'); return }
    if (password.length < 10)  { setError('La contraseña debe tener al menos 10 caracteres'); return }
    if (slugStatus !== 'ok')   { setError('Verificá que la URL de tu negocio esté disponible'); return }

    setLoading(true)
    try {
      await registerBusiness({ slug, businessName, ...(ownerName ? { ownerName } : {}), email, password })
      router.push('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'slug_taken')         setError('Ese nombre de URL ya está en uso. Elegí otro.')
      else if (msg === 'email_taken')   setError('Ya existe una cuenta con ese email.')
      else if (msg.startsWith('slug_')) setError('Ese slug no está permitido. Elegí otro.')
      else                              setError('No pudimos crear tu negocio. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none fixed top-1/4 left-1/4 h-72 w-72 rounded-full opacity-20 blur-3xl animate-float"
        style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }}
      />
      <div
        className="pointer-events-none fixed bottom-1/4 right-1/4 h-72 w-72 rounded-full opacity-20 blur-3xl animate-float"
        style={{ background: 'radial-gradient(circle, #14B8A6, transparent)', animationDelay: '3s' }}
      />

      <div className="relative w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="animate-float">
            <div className="flex items-center justify-center rounded-2xl bg-slate-950/60 px-4 py-3 shadow-glow">
              <Logo size="md" variant="sidebar" className="h-8 w-auto" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-8">
          <h1 className="mb-1 text-xl font-bold" style={{ color: 'var(--text)' }}>
            Crear mi negocio
          </h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
            Gratis durante el beta · Sin tarjeta · Sin contratos
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="businessName">Nombre del negocio</Label>
              <Input
                id="businessName"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="El Fogón de María"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="slug">URL del catálogo</Label>
              <Input
                id="slug"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  setSlugEdited(true)
                }}
                placeholder="el-fogon"
              />
              <p className="text-xs" style={{ color: slugHintColor() }}>{slugHint()}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ownerName">
                Tu nombre <span className="font-normal opacity-60">(opcional)</span>
              </Label>
              <Input
                id="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="María García"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@negocio.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">
                Contraseña <span className="font-normal opacity-60">(mín. 10 caracteres)</span>
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={10}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••••"
              />
            </div>

            {error != null && (
              <p
                className="rounded-xl px-4 py-2.5 text-sm"
                style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: 'var(--error)', border: '1px solid rgba(220,38,38,0.2)' }}
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || slugStatus === 'taken' || slugStatus === 'invalid' || slugStatus === 'checking'}
              className="w-full mt-1 bg-gradient-teal-violet shadow-glow hover:opacity-90"
            >
              {loading ? 'Creando negocio…' : 'Crear mi negocio →'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: 'var(--muted)' }}>
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" style={{ color: 'var(--primary)' }}>
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}