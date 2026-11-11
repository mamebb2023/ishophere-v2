import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Phone,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications } from '@/hooks/useNotifications'
import { getErrorMessage, formatDate } from '@/lib/format'
import { formatMoney } from '@/lib/money'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Order } from '@/lib/types'

export function OrderConfirmation() {
  const { id } = useParams<{ id: string }>()
  const { markOrderRead } = useNotifications()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const markedOrderRef = useRef<string | null>(null)

  const load = useCallback(async () => {
    if (!id || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*, item:items(id, name, image_url))')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      setError(getErrorMessage(fetchError))
    } else {
      setOrder(data as unknown as Order | null)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!order || markedOrderRef.current === order.id) return
    markedOrderRef.current = order.id
    void markOrderRead(order.id)
  }, [order, markOrderRead])

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!order) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Order not found"
        description={
          error ??
          'This order does not exist, or it belongs to a different account.'
        }
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link to="/">Back to shop</Link>
            </Button>
            {error ? (
              <Button
                variant="outline"
                onClick={() => {
                  void load()
                }}
              >
                <RefreshCw />
                Retry
              </Button>
            ) : null}
          </div>
        }
      />
    )
  }

  const items = order.order_items ?? []
  const shortId = order.id.slice(0, 8).toUpperCase()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          Order placed
        </h1>
        <p className="text-sm text-muted-foreground">
          Thanks, {order.customer_name}. The shop will contact you to confirm.
        </p>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="font-mono font-semibold">#{shortId}</span>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {error ? (
        <Alert variant="error" title="Could not refresh order">
          <p>{error}</p>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Order details</CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatDate(order.created_at)}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="divide-y">
            {items.map((line) => (
              <div key={line.id} className="flex items-center gap-3 py-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {line.item?.image_url ? (
                    <img
                      src={line.item.image_url}
                      alt={line.item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ShoppingBag className="h-5 w-5" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold">
                    {line.item?.name ?? 'Item'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty {line.quantity} · {formatMoney(line.unit_price_cents)} each
                  </p>
                </div>
                <span className="text-sm font-bold">
                  {formatMoney(line.line_total_cents)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t pt-3 text-base font-bold">
            <span>Total</span>
            <span>{formatMoney(order.total_cents)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {order.customer_phone}
          </p>
          {order.customer_address ? (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="whitespace-pre-line">{order.customer_address}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1">
          <Link to="/">
            Continue shopping
            <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/account">View my orders</Link>
        </Button>
      </div>
    </div>
  )
}
