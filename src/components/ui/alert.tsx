import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type AlertVariant = 'error' | 'success' | 'info'

const styles: Record<AlertVariant, string> = {
  error: 'border-destructive/20 bg-destructive/10 text-destructive',
  success: 'border-success/20 bg-success/10 text-success',
  info: 'border-info/20 bg-info/10 text-info',
}

const icons: Record<AlertVariant, typeof Info> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: AlertVariant
  title?: string
  children?: ReactNode
  className?: string
}) {
  const Icon = icons[variant]
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 text-sm',
        styles[variant],
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && 'mt-1')}>{children}</div> : null}
      </div>
    </div>
  )
}
