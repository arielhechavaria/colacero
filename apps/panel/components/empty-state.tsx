import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon:        string
  title:       string
  description: string
  action?: {
    label:   string
    onClick?: () => void
    href?:    string
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const button = action && (
    <Button variant="outline" size="sm" className="mt-2" onClick={action.onClick}>
      {action.label}
    </Button>
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center text-center gap-3">
      <span className="text-5xl">{icon}</span>
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="text-sm max-w-md text-slate-500">{description}</p>
      {action?.href ? <Link href={action.href}>{button}</Link> : button}
    </div>
  )
}
