import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/lib/types'

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: 'info' | 'warning' | 'success' | 'destructive' }
> = {
  new: { label: 'New Order', variant: 'info' },
  confirmed: { label: 'To Be Delivered', variant: 'warning' },
  shipped: { label: 'Delivered', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status] ?? statusConfig.new
  return <Badge variant={config.variant}>{config.label}</Badge>
}
