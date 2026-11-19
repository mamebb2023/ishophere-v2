import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Eye,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { EmptyState } from '@/components/EmptyState'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, getErrorMessage } from '@/lib/format'
import { formatMoney } from '@/lib/money'
import { formatPhoneNumber } from '@/lib/phone'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { AdminUser, OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface RecentOrder {
  id: string
  status: OrderStatus
  total_cents: number
  created_at: string
}

function displayName(user: AdminUser): string {
  return user.name?.trim() || user.email || user.phone || 'Unnamed customer'
}

function accountType(user: AdminUser): string {
  if (user.email && user.phone) return 'Email + phone'
  if (user.email) return 'Email'
  if (user.phone) return 'Phone'
  return 'No contact info'
}

function UserAvatar({
  user,
  className,
}: {
  user: AdminUser
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold uppercase text-secondary-foreground',
        className,
      )}
      aria-hidden="true"
    >
      {displayName(user).slice(0, 1)}
    </span>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold">{value}</p>
    </div>
  )
}

function UserOrders({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    void (async () => {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('id, status, total_cents, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!active) return
      if (fetchError) {
        setError(getErrorMessage(fetchError))
      } else {
        setOrders((data ?? []) as RecentOrder[])
      }
      setLoading(false)
    })()

    return () => {
      active = false
    }
  }, [userId])

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Recent orders
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="error" title="Could not load orders">
          <p>{error}</p>
        </Alert>
      ) : orders.length === 0 ? (
        <p className="rounded-xl border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
          No orders yet.
        </p>
      ) : (
        <div className="divide-y rounded-xl border px-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-3 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(order.created_at)}
                </p>
              </div>
              <StatusBadge status={order.status} />
              <span className="shrink-0 font-semibold">
                {formatMoney(order.total_cents)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<AdminUser | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase.rpc('admin_users')

    if (fetchError) {
      setError(
        fetchError.code === 'PGRST202'
          ? 'The users directory is not available yet. Apply the latest database update and refresh.'
          : getErrorMessage(fetchError),
      )
    } else {
      setUsers((data ?? []) as AdminUser[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return users

    return users.filter((user) =>
      [user.name, user.email, user.phone].some((value) =>
        value?.toLowerCase().includes(needle),
      ),
    )
  }, [users, query])

  return (
    <div>
      <AdminPageHeader
        icon={Users}
        title="Users"
        description="Customer accounts, contact details, and order history."
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
            placeholder="Search name, email, or phone…"
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground sm:ml-auto">
          {filtered.length} user{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {error ? (
        <Alert variant="error" title="Could not load users" className="mb-4">
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
          icon={Users}
          title={users.length === 0 ? 'No users yet' : 'No matching users'}
          description={
            users.length === 0
              ? 'Customer accounts will appear here after sign-up.'
              : 'Try a different name, email, or phone number.'
          }
        />
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-4 py-3 text-right font-semibold">Orders</th>
                    <th className="px-4 py-3 text-right font-semibold">Spent</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-semibold">
                                {displayName(user)}
                              </p>
                              {user.is_admin ? (
                                <Badge variant="secondary">Owner</Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {accountType(user)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-56 truncate">
                          {user.email ?? 'No email'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.phone
                            ? formatPhoneNumber(user.phone)
                            : 'No phone'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {user.order_count}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatMoney(user.total_spent_cents)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelected(user)}
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
            {filtered.map((user) => (
              <Card key={user.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar user={user} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">
                          {displayName(user)}
                        </p>
                        {user.is_admin ? (
                          <Badge variant="secondary">Owner</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {accountType(user)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected(user)}
                    >
                      <Eye />
                      View
                    </Button>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {user.email ?? 'No email'}
                      </span>
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {user.phone
                          ? formatPhoneNumber(user.phone)
                          : 'No phone'}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <span>
                      {user.order_count} order
                      {user.order_count === 1 ? '' : 's'}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatMoney(user.total_spent_cents)}
                    </span>
                    <span>Joined {formatDate(user.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent>
          {selected ? (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <UserAvatar
                    user={selected}
                    className="h-12 w-12 text-base"
                  />
                  <div className="min-w-0">
                    <DialogTitle className="truncate">
                      {displayName(selected)}
                    </DialogTitle>
                    <DialogDescription>
                      {selected.is_admin ? 'Shop owner' : 'Customer'} · Joined{' '}
                      {formatDate(selected.created_at)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-3 rounded-xl border p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="break-all">{selected.email ?? 'Not added'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p>
                      {selected.phone
                        ? formatPhoneNumber(selected.phone)
                        : 'Not added'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Account type
                    </p>
                    <p>{accountType(selected)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Stat label="Orders" value={String(selected.order_count)} />
                <Stat
                  label="Spent"
                  value={formatMoney(selected.total_spent_cents)}
                />
                <Stat
                  label="Last order"
                  value={
                    selected.last_order_at
                      ? formatDate(selected.last_order_at)
                      : '—'
                  }
                />
              </div>

              <UserOrders key={selected.id} userId={selected.id} />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
