interface LogoProps {
  size?:    'sm' | 'md'
  /** 'sidebar' = siempre blanco (fondo oscuro fijo) | 'page' = usa var(--text) (respeta el tema) */
  variant?: 'sidebar' | 'page'
  className?: string
}

export function Logo({ size = 'md', variant = 'sidebar', className = '' }: LogoProps) {
  const fontSize  = size === 'sm' ? 14 : 17
  const textFill  = variant === 'sidebar' ? 'white' : 'var(--text)'

  return (
    <svg
      width={size === 'sm' ? 130 : 155}
      height={size === 'sm' ? 36 : 42}
      viewBox={`0 0 ${size === 'sm' ? 130 : 155} ${size === 'sm' ? 36 : 42}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ColaCero"
    >
      <g transform="translate(0,6)">
        {/* Wave — accent color */}
        <path
          d="M4 14 C4 14 7 8 11 14 C15 20 19 10 23 14"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Arrow — primary color */}
        <line
          x1="23" y1="14" x2="33" y2="14"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <polyline
          points="29,10 34,14 29,18"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      {/* "Cola" */}
      <text
        x="44"
        y={size === 'sm' ? 24 : 28}
        fontFamily="var(--font-display)"
        fontWeight="800"
        fontSize={fontSize}
        fill={textFill}
      >
        Cola
      </text>
      {/* "Cero" — always primary */}
      <text
        x={size === 'sm' ? 85 : 100}
        y={size === 'sm' ? 24 : 28}
        fontFamily="var(--font-display)"
        fontWeight="400"
        fontSize={fontSize}
        fill="var(--primary)"
      >
        Cero
      </text>
    </svg>
  )
}
