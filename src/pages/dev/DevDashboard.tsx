import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Plus,
  RefreshCw,
  ShieldCheck,
  Store as StoreIcon,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/lib/format'
import { storeAdminPath, storePath } from '@/lib/storeRoutes'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { DevStoreRow } from '@/lib/types'

export function DevDashboard() {
  const [stores, setStores] = useState<DevStoreRow[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase.rpc('dev_list_stores')

    if (fetchError) {
      setError(getErrorMessage(fetchError))
    } else {
      setStores((data ?? []) as DevStoreRow[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const activeCount = stores.filter((store) => store.is_active).length
  const staffCount = stores.reduce(
    (total, store) => total + Number(store.staff_count ?? 0),
    0,
  )

  const cards: Array<{
    label: string
    value: string
    icon: LucideIcon
    className: string
  }> = [
    {
      label: 'Stores',
      value: loading ? '—' : String(stores.length),
      icon: StoreIcon,
      className: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Active',
      value: loading ? '—' : String(activeCount),
      icon: ShieldCheck,
      className: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Staff',
      value: loading ? '—' : String(staffCount),
      icon: Users,
      className: 'bg-amber-100 text-amber-700',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Platform overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create stores, assign owners, and open any storefront.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link to="/dev/stores/new">
              <Plus />
              Create store
            </Link>
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="error" title="Could not load platform data">
          <p>{error}</p>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
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
                <p className="truncate text-lg font-black sm:text-xl">
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent stores</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dev/stores">
              View all
              <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : stores.length === 0 ? (
            <EmptyState
              icon={StoreIcon}
              title="No stores yet"
              description="Create the first store and assign an existing iShopHere account as its owner."
              className="border-0 bg-transparent px-0 py-6"
              action={
                <Button asChild>
                  <Link to="/dev/stores/new">
                    <Plus />
                    Create store
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y">
              {stores.slice(0, 5).map((store) => (
                <div
                  key={store.id}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{
                      background: `linear-gradient(135deg, ${store.primary_color}, ${store.secondary_color})`,
                    }}
                  >
                    <StoreIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="truncate">{store.name}</span>
                      <Badge variant={store.is_active ? 'success' : 'muted'}>
                        {store.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      /s/{store.slug}
                      {store.owner_name ? ` · ${store.owner_name}` : ''}
                      {store.owner_email ? ` · ${store.owner_email}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={storePath(store.slug)}>Visit</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={storeAdminPath(store.slug)}>Admin</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
