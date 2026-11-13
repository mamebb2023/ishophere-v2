import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Package,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDate, getErrorMessage } from '@/lib/format'
import { formatMoney } from '@/lib/money'
import { storeAdminPath, storePath } from '@/lib/storeRoutes'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Order } from '@/lib/types'

export function Account() {
  const { user, isDev, isAdmin, memberships, signOut } = useAuth()
  const { isOrderUnread } = useNotifications()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const loadOrders = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('orders')
      .select(
        'id, store_id, status, total_cents, created_at, store:stores(id, name, slug)',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error(getErrorMessage(error))
    } else {
      setOrders((data ?? []) as unknown as Order[])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Signed out')
      navigate('/')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const roleLabel = isDev
    ? 'Platform owner'
    : memberships.some((membership) => membership.role === 'owner')
      ? 'Store owner'
      : memberships.length > 0
        ? 'Store team'
        : 'Customer'

  const singleMembership = memberships.length === 1 ? memberships[0] : null
  const adminHref = isDev
    ? '/dev'
    : singleMembership?.store?.slug
      ? storeAdminPath(singleMembership.store.slug)
      : '/admin'

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            My account
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your details and orders across stores.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void handleSignOut()}>
          <LogOut />
          Sign out
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <UserRound className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{user?.email}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {roleLabel}
              {user?.created_at ? ` · Joined ${formatDate(user.created_at)}` : ''}
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/stores">
              <Store />
              Browse stores
            </Link>
          </Button>
          {isAdmin ? (
            <Button asChild size="sm">
              <Link to={adminHref}>
                {isDev ? <ShieldCheck /> : <LayoutDashboard />}
                {isDev
                  ? 'Dev console'
                  : memberships.length > 1
                    ? 'Choose store'
                    : 'Admin dashboard'}
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order history</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="Your completed checkouts will appear here."
              className="border-0 bg-transparent px-0 py-6"
              action={
                <Button asChild size="sm">
                  <Link to="/stores">Start shopping</Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y">
              {orders.map((order) => {
                const orderHref = order.store?.slug
                  ? storePath(order.store.slug, `/order/${order.id}`)
                  : '/account'
                return (
                  <Link
                    key={order.id}
                    to={orderHref}
                    className="flex items-center gap-3 py-3 transition-colors hover:text-primary"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                      <Package className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        #{order.id.slice(0, 8).toUpperCase()}
                        {isOrderUnread(order.id) ? (
                          <span
                            role="img"
                            aria-label="Unread order update"
                            title="Unread order update"
                            className="h-2 w-2 shrink-0 rounded-full bg-destructive"
                          />
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.store?.name ? `${order.store.name} · ` : ''}
                        {formatDate(order.created_at)} ·{' '}
                        {formatMoney(order.total_cents)}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
