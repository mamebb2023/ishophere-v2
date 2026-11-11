import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Package,
  Plus,
  ReceiptText,
  RefreshCw,
  Settings,
  ShoppingCart,
} from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, getErrorMessage } from '@/lib/format'
import { formatMoney } from '@/lib/money'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Order } from '@/lib/types'

interface Stats {
  salesCents: number
  orderCount: number
  itemCount: number
  lowStockCount: number
}

export function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({
    salesCents: 0,
    orderCount: 0,
    itemCount: 0,
    lowStockCount: 0,
  })
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const [ordersResult, itemsResult] = await Promise.all([
      supabase
        .from('orders')
        .select('id, customer_name, status, total_cents, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('items').select('id, stock'),
    ])

    if (ordersResult.error || itemsResult.error) {
      setError(getErrorMessage(ordersResult.error || itemsResult.error))
    } else {
      const orderRows = (ordersResult.data ?? []) as unknown as Order[]
      const itemRows = (itemsResult.data ?? []) as { id: string; stock: number }[]
      setOrders(orderRows)
      setStats({
        salesCents: orderRows
          .filter((order) => order.status !== 'cancelled')
          .reduce((sum, order) => sum + order.total_cents, 0),
        orderCount: orderRows.length,
        itemCount: itemRows.length,
        lowStockCount: itemRows.filter((item) => item.stock < 5).length,
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const recentOrders = orders.slice(0, 5)

  const cards = [
    {
      label: 'Total sales',
      value: formatMoney(stats.salesCents),
      icon: Banknote,
      className: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Orders',
      value: String(stats.orderCount),
      icon: ReceiptText,
      className: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Items',
      value: String(stats.itemCount),
      icon: Package,
      className: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Low stock',
      value: String(stats.lowStockCount),
      icon: AlertTriangle,
      className: 'bg-rose-100 text-rose-700',
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="A quick snapshot of the shop."
        action={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/settings">
                <Settings />
                Settings
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/admin/items/new">
                <Plus />
                Add item
              </Link>
            </Button>
          </>
        }
      />

      {error ? (
        <Alert variant="error" title="Could not load dashboard data" className="mb-5">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              void load()
            }}
          >
            <RefreshCw />
            Retry
          </Button>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.className}`}
              >
                <card.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                {loading ? (
                  <Skeleton className="mt-1 h-6 w-16" />
                ) : (
                  <p className="truncate text-lg font-black sm:text-xl">
                    {card.value}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent orders</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/orders">
                View all
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No orders yet.
              </p>
            ) : (
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to="/admin/orders"
                    className="flex items-center gap-3 py-3 transition-colors hover:text-primary"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <ShoppingCart className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {order.customer_name}{' '}
                        <span className="font-mono text-xs text-muted-foreground">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <span className="hidden text-sm font-semibold sm:inline">
                      {formatMoney(order.total_cents)}
                    </span>
                    <StatusBadge status={order.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/items/new">
                <Plus />
                Add a new item
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/items">
                <Package />
                Manage items
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/orders">
                <ReceiptText />
                Manage orders
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/settings">
                <Settings />
                Edit shop theme
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
