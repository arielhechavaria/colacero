import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon:        LucideIcon
  title:       string
  description: string
  action?: {
    label:   string
    onClick?: () => void
    href?:    string
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const button = action && (
    <Button variant="outline" size="sm" className="mt-2" onClick={action.onClick}>
      {action.label}
    </Button>
  )

  return (
    <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] p-12 flex flex-col items-center text-center gap-3">
      <div className="rounded-2xl bg-white/[0.06] p-4">
        <Icon className="h-8 w-8 text-slate-500" strokeWidth={1.25} />
      </div>
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="text-sm max-w-md text-slate-500">{description}</p>
      {action?.href ? <Link href={action.href}>{button}</Link> : button}
    </div>
  )
}
