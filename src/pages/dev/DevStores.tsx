import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, LayoutDashboard, Plus, RefreshCw, Store as StoreIcon } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, getErrorMessage } from '@/lib/format'
import { storeAdminPath, storePath } from '@/lib/storeRoutes'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { DevStoreRow } from '@/lib/types'

export function DevStores() {
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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Stores
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every storefront on the platform and its owner.
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
        <Alert variant="error" title="Could not load stores">
          <p>{error}</p>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title="No stores yet"
          description="Create the first store and assign an existing iShopHere account as its owner."
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
        <>
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Store</th>
                    <th className="px-4 py-3 font-semibold">Owner</th>
                    <th className="px-4 py-3 font-semibold">Team</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stores.map((store) => (
                    <tr key={store.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                            style={{
                              background: `linear-gradient(135deg, ${store.primary_color}, ${store.secondary_color})`,
                            }}
                          >
                            <StoreIcon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{store.name}</p>
                            <p className="truncate font-mono text-xs text-muted-foreground">
                              /s/{store.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{store.owner_name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {store.owner_email ?? 'No owner'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {store.staff_count} staff
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={store.is_active ? 'success' : 'muted'}>
                          {store.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(store.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <Link to={storePath(store.slug)}>
                              <ExternalLink />
                              Visit
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link to={storeAdminPath(store.slug)}>
                              <LayoutDashboard />
                              Admin
                            </Link>
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
            {stores.map((store) => (
              <Card key={store.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
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
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        /s/{store.slug}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/60 p-3 text-xs">
                    <p className="font-semibold text-foreground">
                      {store.owner_name ?? 'No owner'}
                    </p>
                    <p className="truncate text-muted-foreground">
                      {store.owner_email ?? '—'} · {store.staff_count} staff
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Created {formatDate(store.created_at)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to={storePath(store.slug)}>
                        <ExternalLink />
                        Visit
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link to={storeAdminPath(store.slug)}>
                        <LayoutDashboard />
                        Admin
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
