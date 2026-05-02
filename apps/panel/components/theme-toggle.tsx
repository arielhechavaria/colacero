'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme')
    const prefer = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDark(stored ? stored === 'dark' : prefer)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  if (!mounted) return <div className={`w-8 h-8 ${className}`} />

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Modo claro' : 'Modo oscuro'}
      className={`
        flex h-8 w-8 items-center justify-center rounded-full text-sm
        bg-white/10 hover:bg-white/20 text-white/70 hover:text-white
        transition-all
        ${className}
      `}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
