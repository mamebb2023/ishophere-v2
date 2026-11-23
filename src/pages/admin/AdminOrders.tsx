import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Eye,
  Phone,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { EmptyState } from '@/components/EmptyState'
import {
  ORDER_STATUS_OPTIONS,
  OrderStatusSelect,
} from '@/components/OrderStatusSelect'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { notifyOrdersChanged } from '@/lib/events'
import { formatDate, getErrorMessage } from '@/lib/format'
import { formatMoney } from '@/lib/money'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Order, OrderStatus } from '@/lib/types'

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | OrderStatus>('all')
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Order | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*, item:items(id, name, image_url))')
      .order('created_at', { ascending: false })
      .limit(200)

    if (fetchError) {
      setError(getErrorMessage(fetchError))
    } else {
      setOrders((data ?? []) as unknown as Order[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return orders.filter((order) => {
      if (filter !== 'all' && order.status !== filter) return false
      if (!needle) return true
      return (
        order.customer_name.toLowerCase().includes(needle) ||
        order.customer_phone.toLowerCase().includes(needle) ||
        order.id.toLowerCase().includes(needle)
      )
    })
  }, [orders, filter, query])

  async function updateStatus(order: Order, status: OrderStatus) {
    setBusyId(order.id)
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', order.id)
      if (updateError) throw updateError
      setOrders((current) =>
        current.map((row) => (row.id === order.id ? { ...row, status } : row)),
      )
      setSelected((current) =>
        current && current.id === order.id ? { ...current, status } : current,
      )
      notifyOrdersChanged()
      toast.success(`Order #${order.id.slice(0, 8).toUpperCase()} updated`)
    } catch (updateError) {
      toast.error(getErrorMessage(updateError))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        icon={ReceiptText}
        title="Orders"
        description="Review customer details and move orders through fulfillment."
        action={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw />
            Refresh
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, phone, or order…"
            className="pl-9"
          />
        </div>
        <Select
          value={filter}
          onChange={(event) => setFilter(event.target.value as 'all' | OrderStatus)}
          className="sm:w-40"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {ORDER_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <span className="text-sm text-muted-foreground sm:ml-auto">
          {filtered.length} order{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {error ? (
        <Alert variant="error" title="Could not load orders" className="mb-4">
          <p>{error}</p>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={orders.length === 0 ? 'No orders yet' : 'No matching orders'}
          description={
            orders.length === 0
              ? 'Customer orders will appear here after checkout.'
              : 'Try a different search or status filter.'
          }
        />
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-semibold">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.customer_phone}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {formatMoney(order.total_cents)}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusSelect
                          value={order.status}
                          disabled={busyId === order.id}
                          onChange={(status) => void updateStatus(order, status)}
                          ariaLabel={`Status for order ${order.id.slice(0, 8)}`}
                          className="w-36"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelected(order)}
                          >
                            <Eye />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-3 md:hidden">
            {filtered.map((order) => (
              <Card key={order.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-semibold">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <OrderStatusSelect
                      value={order.status}
                      disabled={busyId === order.id}
                      onChange={(status) => void updateStatus(order, status)}
                      ariaLabel={`Status for order ${order.id.slice(0, 8)}`}
                      className="w-32 shrink-0"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer_phone}
                      </p>
                    </div>
                    <span className="text-sm font-bold">
                      {formatMoney(order.total_cents)}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelected(order)}
                  >
                    <Eye />
                    View
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  Order #{selected.id.slice(0, 8).toUpperCase()}
                </DialogTitle>
                <DialogDescription>
                  {formatDate(selected.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center justify-between gap-2 rounded-xl bg-muted p-3 text-sm">
                <div>
                  <p className="font-semibold">{selected.customer_name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0 text-primary" />
                    <a
                      href={`tel:${selected.customer_phone}`}
                      className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label={`Call ${selected.customer_phone}`}
                    >
                      {selected.customer_phone}
                    </a>
                  </p>
                </div>
                <OrderStatusSelect
                  value={selected.status}
                  disabled={busyId === selected.id}
                  onChange={(status) => void updateStatus(selected, status)}
                  ariaLabel="Update order status"
                  className="w-32 shrink-0"
                />
              </div>

              <div className="divide-y">
                {(selected.order_items ?? []).map((line) => (
                  <div key={line.id} className="flex items-center gap-3 py-2.5">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {line.item?.image_url ? (
                        <img
                          src={line.item.image_url}
                          alt={line.item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ShoppingBag className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">
                        {line.item?.name ?? 'Item'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty {line.quantity} · {formatMoney(line.unit_price_cents)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatMoney(line.line_total_cents)}
                    </span>
                  </div>
                ))}
              </div>

              {selected.customer_address ? (
                <div className="rounded-xl border p-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Delivery / pickup note
                  </p>
                  <p className="mt-1 whitespace-pre-line">
                    {selected.customer_address}
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-between border-t pt-3 text-base font-bold">
                <span>Total</span>
                <span>{formatMoney(selected.total_cents)}</span>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
