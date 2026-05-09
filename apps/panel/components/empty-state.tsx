import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon:        string
  title:       string
  description: string
  action?:     { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass rounded-2xl p-12 flex flex-col items-center text-center gap-3">
      <span className="text-4xl">{icon}</span>
      <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>{title}</p>
      <p className="text-sm max-w-xs" style={{ color: 'var(--muted)' }}>{description}</p>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  )
}
