// 'use client'
//
// import { useState, useEffect, useCallback } from 'react'
// import Link from 'next/link'
// import { useRouter } from 'next/navigation'
// import { registerOwner, checkSlugAvailable } from '../../lib/api'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Logo } from '@/components/logo'
//
// function SlugStatus({ slug }: { slug: string }) {
//   const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle')
//
//   const check = useCallback(async (s: string) => {
//     if (s.length < 3) { setStatus('idle'); return }
//     setStatus('checking')
//     const result = await checkSlugAvailable(s)
//     setStatus(result.available ? 'ok' : result.reason === 'invalid_chars' || result.reason === 'too_short' ? 'invalid' : 'taken')
//   }, [])
//
//   useEffect(() => {
//     const timer = setTimeout(() => { void check(slug) }, 400)
//     return () => clearTimeout(timer)
//   }, [slug, check])
//
//   if (status === 'idle')     return null
//   if (status === 'checking') return <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Verificando…</p>
//   if (status === 'ok')       return <p className="text-xs mt-1" style={{ color: '#22c55e' }}>✓ Disponible — tu negocio quedaría en <strong>{slug}.colacero.com</strong></p>
//   if (status === 'taken')    return <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>✗ Ya está en uso, elegí otro</p>
//   return <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>✗ Solo letras minúsculas, números y guiones (mín. 3 caracteres)</p>
// }
//
// export default function SignupPage() {
//   const router = useRouter()
//
//   const [slug,         setSlug]         = useState('')
//   const [businessName, setBusinessName] = useState('')
//   const [ownerName,    setOwnerName]    = useState('')
//   const [email,        setEmail]        = useState('')
//   const [password,     setPassword]     = useState('')
//   const [loading,      setLoading]      = useState(false)
//   const [error,        setError]        = useState<string | null>(null)
//
//   function normalizeSlug(value: string) {
//     return value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+/, '')
//   }
//
//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault()
//     if (password.length < 10) { setError('La contraseña debe tener al menos 10 caracteres'); return }
//     setLoading(true)
//     setError(null)
//     try {
//       await registerOwner({ slug, businessName, ownerName, email, password })
//       router.push('/onboarding')
//     } catch (err) {
//       const msg = err instanceof Error ? err.message : 'register_failed'
//       const labels: Record<string, string> = {
//         slug_taken:    'Ese slug ya está en uso. Elegí otro.',
//         email_taken:   'Ese email ya tiene una cuenta. ¿Querés iniciar sesión?',
//         validation_error: 'Revisá los datos ingresados.',
//         slug_too_short:   'El slug debe tener al menos 3 caracteres.',
//         slug_too_long:    'El slug no puede tener más de 32 caracteres.',
//         slug_invalid_chars: 'El slug solo puede tener letras minúsculas, números y guiones.',
//         slug_reserved:      'Ese slug está reservado. Elegí otro.',
//         slug_brand_protected: 'Ese slug está protegido. Elegí otro.',
//       }
//       setError(labels[msg] ?? 'Error al registrar. Intentá de nuevo.')
//     } finally {
//       setLoading(false)
//     }
//   }
//
//   return (
//     <div className="min-h-screen flex items-center justify-center px-4 py-12">
//       <div
//         className="pointer-events-none fixed top-1/4 left-1/4 h-72 w-72 rounded-full opacity-20 blur-3xl animate-float"
//         style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }}
//       />
//       <div
//         className="pointer-events-none fixed bottom-1/4 right-1/4 h-72 w-72 rounded-full opacity-20 blur-3xl animate-float"
//         style={{ background: 'radial-gradient(circle, #A855F7, transparent)', animationDelay: '3s' }}
//       />
//
//       <div className="relative w-full max-w-md">
//         <div className="flex justify-center mb-8">
//           <div className="animate-float">
//             <div className="flex items-center justify-center rounded-2xl bg-slate-950/60 px-4 py-3 shadow-glow">
//               <Logo size="md" variant="page" className="h-8 w-auto" />
//             </div>
//           </div>
//         </div>
//
//         <div className="glass rounded-2xl p-8">
//           <h1 className="mb-1 text-2xl font-bold" style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
//             Crear tu negocio
//           </h1>
//           <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
//             Gratis, sin tarjeta de crédito.
//           </p>
//
//           <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
//             {/* Slug */}
//             <div className="flex flex-col gap-1.5">
//               <Label htmlFor="slug">Dirección de tu negocio</Label>
//               <div className="flex items-center gap-2">
//                 <Input
//                   id="slug"
//                   type="text"
//                   required
//                   value={slug}
//                   onChange={(e) => setSlug(normalizeSlug(e.target.value))}
//                   placeholder="mi-negocio"
//                   className="flex-1"
//                   maxLength={32}
//                 />
//                 <span className="text-sm shrink-0" style={{ color: 'var(--muted)' }}>.colacero.com</span>
//               </div>
//               <SlugStatus slug={slug} />
//             </div>
//
//             {/* Nombre del negocio */}
//             <div className="flex flex-col gap-1.5">
//               <Label htmlFor="businessName">Nombre del negocio</Label>
//               <Input
//                 id="businessName"
//                 type="text"
//                 required
//                 value={businessName}
//                 onChange={(e) => setBusinessName(e.target.value)}
//                 placeholder="El Fogón de María"
//                 maxLength={60}
//               />
//             </div>
//
//             {/* Nombre del dueño */}
//             <div className="flex flex-col gap-1.5">
//               <Label htmlFor="ownerName">Tu nombre (opcional)</Label>
//               <Input
//                 id="ownerName"
//                 type="text"
//                 value={ownerName}
//                 onChange={(e) => setOwnerName(e.target.value)}
//                 placeholder="María García"
//               />
//             </div>
//
//             {/* Email */}
//             <div className="flex flex-col gap-1.5">
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 required
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="maria@minegocio.com"
//               />
//             </div>
//
//             {/* Password */}
//             <div className="flex flex-col gap-1.5">
//               <Label htmlFor="password">Contraseña</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 required
//                 minLength={10}
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Mínimo 10 caracteres"
//               />
//             </div>
//
//             {error != null && (
//               <p className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: 'var(--error)', border: '1px solid rgba(220,38,38,0.2)' }}>
//                 {error}
//               </p>
//             )}
//
//             <Button
//               type="submit"
//               disabled={loading}
//               className="w-full mt-1 bg-gradient-teal-violet shadow-glow hover:opacity-90"
//             >
//               {loading ? 'Creando tu negocio…' : 'Crear negocio →'}
//             </Button>
//
//             <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
//               ¿Ya tenés cuenta?{' '}
//               <Link href="/login" style={{ color: 'var(--text)' }} className="underline underline-offset-2">
//                 Iniciar sesión
//               </Link>
//             </p>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }
