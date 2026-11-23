import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'

export const ORDER_STATUS_OPTIONS: ReadonlyArray<{
  value: OrderStatus
  label: string
}> = [
  { value: 'new', label: 'New Order' },
  { value: 'confirmed', label: 'To Be Delivered' },
  { value: 'shipped', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const selectStyles: Record<OrderStatus, string> = {
  new: 'border-info/25 bg-info/10 text-info hover:bg-info/15',
  confirmed: 'border-warning/25 bg-warning/10 text-warning hover:bg-warning/15',
  shipped: 'border-success/25 bg-success/10 text-success hover:bg-success/15',
  cancelled:
    'border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/15',
}

const dotStyles: Record<OrderStatus, string> = {
  new: 'bg-info',
  confirmed: 'bg-warning',
  shipped: 'bg-success',
  cancelled: 'bg-destructive',
}

export function OrderStatusSelect({
  value,
  onChange,
  disabled,
  ariaLabel,
  className,
}: {
  value: OrderStatus
  onChange: (value: OrderStatus) => void
  disabled?: boolean
  ariaLabel: string
  className?: string
}) {
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-2.5 h-1.5 w-1.5 rounded-full',
          dotStyles[value],
        )}
      />
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as OrderStatus)}
        aria-label={ariaLabel}
        className={cn(
          'h-10 w-full cursor-pointer appearance-none rounded-full border py-0 pl-6 pr-7 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60',
          selectStyles[value],
        )}
      >
        {ORDER_STATUS_OPTIONS.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-card text-foreground"
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2 h-3.5 w-3.5 opacity-70"
      />
    </div>
  )
}
