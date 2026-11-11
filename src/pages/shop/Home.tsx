import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, PackageSearch, RefreshCw, ShoppingBag } from 'lucide-react'
import { CategoryFilter } from '@/components/shop/CategoryFilter'
import { ItemCard } from '@/components/shop/ItemCard'
import { SearchBar } from '@/components/shop/SearchBar'
import { EmptyState } from '@/components/EmptyState'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSettings } from '@/hooks/useSettings'
import { getErrorMessage } from '@/lib/format'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Category, Item } from '@/lib/types'

export function Home() {
  const { settings } = useSettings()
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const [categoriesResult, itemsResult] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
      supabase
        .from('items')
        .select('*, category:categories(id, name, slug)')
        .eq('is_available', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false }),
    ])

    if (categoriesResult.error || itemsResult.error) {
      setError(getErrorMessage(categoriesResult.error || itemsResult.error))
    } else {
      setCategories((categoriesResult.data ?? []) as Category[])
      setItems((itemsResult.data ?? []) as unknown as Item[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((item) => {
      if (selectedCategory && item.category_id !== selectedCategory) return false
      if (!needle) return true
      return (
        item.name.toLowerCase().includes(needle) ||
        (item.description ?? '').toLowerCase().includes(needle) ||
        (item.category?.name ?? '').toLowerCase().includes(needle)
      )
    })
  }, [items, selectedCategory, query])

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--brand),var(--brand-2))] px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-black/10 blur-2xl"
        />
        <div className="relative max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              {settings.shop_name}
            </p>
            <span className="rounded-full bg-[var(--brand-accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#292018]">
              Fresh picks
            </span>
          </div>
          <h1 className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl">
            Everything you need, right here.
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/90 sm:text-base">
            Browse the shop, add to cart, and check out in seconds. Fresh picks,
            clear prices, and real stock counts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="font-bold">
              <a href="#items">
                Shop now
                <ArrowRight />
              </a>
            </Button>
            {!isSupabaseConfigured ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link to="/admin/settings">Setup guide</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section id="items" className="flex flex-col gap-4 scroll-mt-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Shop items
            </h2>
            <p className="text-sm text-muted-foreground">
              {loading
                ? 'Loading the latest items…'
                : `${filteredItems.length} item${filteredItems.length === 1 ? '' : 's'} available`}
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <SearchBar value={query} onChange={setQuery} />
          </div>
        </div>

        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {error ? (
          <Alert variant="error" title="Could not load the shop">
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
              Try again
            </Button>
          </Alert>
        ) : null}

        {!isSupabaseConfigured && !loading ? (
          <EmptyState
            icon={ShoppingBag}
            title="Connect Supabase to start"
            description="Add your project URL and anon key to .env.local, then run the SQL migration in supabase/migrations."
            action={
              <Button asChild>
                <Link to="/admin/settings">View setup</Link>
              </Button>
            }
          />
        ) : null}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border sm:rounded-2xl">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="space-y-2 p-3 sm:p-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && !error && filteredItems.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title={items.length === 0 ? 'No items yet' : 'No matching items'}
            description={
              items.length === 0
                ? 'The shop owner has not added any items yet. Check back soon.'
                : 'Try a different search or category.'
            }
            action={
              items.length === 0 ? null : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('')
                    setSelectedCategory(null)
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        ) : null}

        {!loading && filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
