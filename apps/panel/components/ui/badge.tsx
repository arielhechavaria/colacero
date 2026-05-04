import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-[var(--primary)] text-white',
        secondary:   'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]',
        destructive: 'bg-[rgba(248,113,113,0.15)] text-[var(--error)]',
        outline:     'border border-[var(--border)] text-[var(--text)]',
        success:     'bg-[rgba(52,211,153,0.15)] text-[var(--success)]',
        warning:     'bg-[rgba(251,191,36,0.15)] text-[var(--warning)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
