import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'group relative inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'relative h-6 w-11 rounded-full border transition-colors duration-150 ease-[var(--ease-out)]',
          checked ? 'border-primary bg-primary' : 'border-border bg-muted',
          !disabled && 'group-hover:border-foreground/25',
        )}
      >
        <span
          className={cn(
            'absolute left-0 top-[2px] h-[18px] w-[18px] rounded-full bg-card shadow-sm transition-transform duration-150 ease-[var(--ease-out)] motion-reduce:transition-none',
            checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
          )}
        />
      </span>
    </button>
  ),
)
Switch.displayName = 'Switch'

export { Switch }
