import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus, RefreshCw, Search, Store as StoreIcon } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/format'
import { storePath } from '@/lib/storeRoutes'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Store } from '@/lib/types'

export function StoresDirectory() {
  const { isDev } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (fetchError) {
      setError(getErrorMessage(fetchError))
    } else {
      setStores((data ?? []) as Store[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const needle = query.trim().toLowerCase()
  const filtered = needle
    ? stores.filter(
        (store) =>
          store.name.toLowerCase().includes(needle) ||
          store.description.toLowerCase().includes(needle),
      )
    : stores

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Stores
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One account, every store. Pick a storefront to start shopping.
          </p>
        </div>
        {isDev ? (
          <Button asChild size="sm">
            <Link to="/dev/stores/new">
              <Plus />
              Create store
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search stores…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw />
          Refresh
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} store{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {error ? (
        <Alert variant="error" title="Could not load stores">
          <p>{error}</p>
        </Alert>
      ) : null}

      {!isSupabaseConfigured && !loading ? (
        <EmptyState
          icon={StoreIcon}
          title="Connect Supabase to start"
          description="Add your project URL and anon key to .env.local, then run the migrations in supabase/migrations."
          action={
            <Button asChild>
              <Link to="/admin/login">Sign in</Link>
            </Button>
          }
        />
      ) : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title={stores.length === 0 ? 'No stores yet' : 'No matching stores'}
          description={
            stores.length === 0
              ? 'The platform owner has not opened a store yet. Check back soon.'
              : 'Try a different search term.'
          }
          action={
            stores.length === 0 && isDev ? (
              <Button asChild>
                <Link to="/dev/stores/new">
                  <Plus />
                  Create the first store
                </Link>
              </Button>
            ) : null
          }
        />
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((store) => (
            <Card key={store.id} className="overflow-hidden">
              <div
                className="px-5 py-6 text-white"
                style={{
                  background: `linear-gradient(135deg, ${store.primary_color}, ${store.secondary_color})`,
                }}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <StoreIcon className="h-5 w-5" />
                </span>
                <h2 className="mt-3 truncate text-lg font-black">{store.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-white/90">
                  {store.description}
                </p>
              </div>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <Badge variant="outline" className="font-mono font-normal">
                  /s/{store.slug}
                </Badge>
                <Button asChild size="sm">
                  <Link to={storePath(store.slug)}>
                    Visit
                    <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}
