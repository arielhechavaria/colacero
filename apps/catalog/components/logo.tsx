interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { width: 120, height: 32, viewBox: '0 0 120 32', fontSize: 14, x2: 36, x3: 62 },
  md: { width: 160, height: 44, viewBox: '0 0 160 44', fontSize: 19, x2: 48, x3: 82 },
  lg: { width: 200, height: 52, viewBox: '0 0 200 52', fontSize: 22, x2: 58, x3: 105 },
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const s = sizes[size]
  const yText = size === 'sm' ? 20 : size === 'md' ? 28 : 32
  const yWave = size === 'sm' ? 2 : size === 'md' ? 5 : 7
  const scale = size === 'sm' ? 0.65 : size === 'md' ? 0.85 : 1

  return (
    <svg
      width={s.width}
      height={s.height}
      viewBox={s.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ColaCero"
    >
      <g transform={`translate(0,${yWave}) scale(${scale})`}>
        {/* Wave */}
        <path
          d="M4 17 C4 17 7.5 10 12 17 C16.5 24 21 12 25 17"
          stroke="var(--primary)"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Line */}
        <line
          x1="25" y1="17" x2="37" y2="17"
          stroke="var(--primary)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Arrow */}
        <polyline
          points="33,12 38,17 33,22"
          stroke="var(--primary)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      {/* "Cola" — text color */}
      <text
        x={s.x2}
        y={yText}
        fontFamily="var(--font-display)"
        fontWeight="800"
        fontSize={s.fontSize}
        fill="var(--text)"
      >
        Cola
      </text>
      {/* "Cero" — primary color */}
      <text
        x={s.x3}
        y={yText}
        fontFamily="var(--font-display)"
        fontWeight="400"
        fontSize={s.fontSize}
        fill="var(--primary)"
      >
        Cero
      </text>
    </svg>
  )
}
