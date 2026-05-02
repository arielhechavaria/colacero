import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:  'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        'primary-light': 'var(--primary-light)',
        'primary-dim': 'var(--primary-dim)',
        accent:   'var(--accent)',
        bg:       'var(--bg)',
        surface:  'var(--surface)',
        card:     'var(--card)',
        border:   'var(--border)',
        muted:    'var(--muted)',
        sidebar:  'var(--sidebar)',
        success:  'var(--success)',
        warning:  'var(--warning)',
        error:    'var(--error)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        'glow':       '0 0 16px rgba(0,212,190,0.4)',
        'glow-sm':    '0 0 8px rgba(0,212,190,0.3)',
        'glow-accent':'0 0 16px rgba(255,176,32,0.35)',
      },
    },
  },
  plugins: [],
}

export default config
