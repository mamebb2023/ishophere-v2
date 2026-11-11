import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/lib/types'

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: 'info' | 'warning' | 'success' | 'destructive' }
> = {
  new: { label: 'New', variant: 'info' },
  confirmed: { label: 'Confirmed', variant: 'warning' },
  shipped: { label: 'Shipped', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status] ?? statusConfig.new
  return <Badge variant={config.variant}>{config.label}</Badge>
}
