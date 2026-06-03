interface LogoProps {
  size?:    'sm' | 'md'
  /** 'sidebar' = siempre blanco (fondo oscuro fijo) | 'page' = usa var(--text) (respeta el tema) */
  variant?: 'sidebar' | 'page'
  className?: string
}

export function Logo({ size = 'md', variant = 'sidebar', className = '' }: LogoProps) {
  const fontSize   = size === 'sm' ? 14 : 17
  const iconColor  = variant === 'sidebar' ? 'white' : '#4F46E5'
  const textColor  = variant === 'sidebar' ? 'white' : '#0F172A'
  const ceroColor  = variant === 'sidebar' ? 'white' : '#4F46E5'
  const scale      = size === 'sm' ? 0.75 : 0.90
  const yWave      = size === 'sm' ? 4 : 6

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
      <g transform={`translate(0,${yWave}) scale(${scale})`}>
        {/* Wave */}
        <path
          d="M4 17 C4 17 7.5 10 12 17 C16.5 24 21 12 25 17"
          stroke={iconColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Line */}
        <line
          x1="25" y1="17" x2="37" y2="17"
          stroke={iconColor}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Arrow */}
        <polyline
          points="33,12 38,17 33,22"
          stroke={iconColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      {/* "Cola" */}
      <text
        x={size === 'sm' ? 42 : 50}
        y={size === 'sm' ? 24 : 28}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="800"
        fontSize={fontSize}
        fill={textColor}
      >
        Cola
      </text>
      {/* "Cero" */}
      <text
        x={size === 'sm' ? 83 : 98}
        y={size === 'sm' ? 24 : 28}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="400"
        fontSize={fontSize}
        fill={ceroColor}
      >
        Cero
      </text>
    </svg>
  )
}
