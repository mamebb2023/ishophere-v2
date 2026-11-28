import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Package, PackageSearch, RefreshCw } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { CategoryFilter } from '@/components/shop/CategoryFilter'
import { ItemCard } from '@/components/shop/ItemCard'
import { SearchBar } from '@/components/shop/SearchBar'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useSeo } from '@/hooks/useSeo'
import { useSettings } from '@/hooks/useSettings'
import { getErrorMessage } from '@/lib/format'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Category, Item } from '@/lib/types'

type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc'

export function Items() {
  const { settings } = useSettings()
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const categoryParam = searchParams.get('category')
  const query = searchParams.get('q') ?? ''
  const sortParam = (searchParams.get('sort') as SortOption | null) ?? 'featured'

  useSeo({
    title: `Shop items — ${settings.shop_name}`,
    description: `Browse all available products at ${settings.shop_name}, filter by category, and search by name.`,
    path: '/items',
  })

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
        .select('*, category:categories(id, name, slug, icon, color)')
        .eq('is_available', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false }),
    ]);

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

  const selectedCategoryId = useMemo(() => {
    if (!categoryParam) return null
    const bySlug = categories.find((cat) => cat.slug === categoryParam)
    if (bySlug) return bySlug.id
    const byId = categories.find((cat) => cat.id === categoryParam)
    return byId ? byId.id : categoryParam
  }, [categories, categoryParam])

  function updateParams(updates: {
    q?: string
    categoryId?: string | null
    sort?: SortOption
  }) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)

        if (updates.q !== undefined) {
          if (updates.q) next.set('q', updates.q)
          else next.delete('q')
        }

        if (updates.categoryId !== undefined) {
          if (updates.categoryId) {
            const matched = categories.find((c) => c.id === updates.categoryId)
            next.set('category', matched?.slug ?? updates.categoryId)
          } else {
            next.delete('category')
          }
        }

        if (updates.sort !== undefined) {
          if (updates.sort && updates.sort !== 'featured') {
            next.set('sort', updates.sort)
          } else {
            next.delete('sort')
          }
        }

        return next
      },
      { replace: true },
    )
  }

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matched = items.filter((item) => {
      if (selectedCategoryId && item.category_id !== selectedCategoryId) {
        return false
      }
      if (!needle) return true
      return (
        item.name.toLowerCase().includes(needle) ||
        (item.description ?? '').toLowerCase().includes(needle) ||
        (item.category?.name ?? '').toLowerCase().includes(needle)
      )
    })

    if (sortParam === 'price-asc') {
      return [...matched].sort((a, b) => a.price_cents - b.price_cents)
    }
    if (sortParam === 'price-desc') {
      return [...matched].sort((a, b) => b.price_cents - a.price_cents)
    }
    if (sortParam === 'newest') {
      return [...matched].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    }
    return matched
  }, [items, selectedCategoryId, query, sortParam])

  const activeCategoryName = useMemo(() => {
    if (!selectedCategoryId) return null
    return categories.find((c) => c.id === selectedCategoryId)?.name ?? null
  }, [categories, selectedCategoryId])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 py-1">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {activeCategoryName ?? 'All items'}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {loading
              ? 'Loading the latest items…'
              : `${filteredItems.length} item${filteredItems.length === 1 ? '' : 's'} available`}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64">
            <SearchBar
              value={query}
              onChange={(next) => updateParams({ q: next })}
            />
          </div>
          <Select
            value={sortParam}
            onChange={(event) =>
              updateParams({ sort: event.target.value as SortOption })
            }
            aria-label="Sort items"
            className="sm:w-44"
          >
            <option value="featured">Sort: Featured</option>
            <option value="newest">Sort: Newest</option>
            <option value="price-asc">Price: Low to high</option>
            <option value="price-desc">Price: High to low</option>
          </Select>
        </div>
      </div>

      <CategoryFilter
        categories={categories}
        selected={selectedCategoryId}
        onSelect={(categoryId) => updateParams({ categoryId })}
      />

      {error ? (
        <Alert variant="error" title="Could not load items">
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

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border sm:rounded-2xl"
            >
              <Skeleton className="aspect-square w-full rounded-none" />
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
              : 'Try a different search, sort, or category.'
          }
          action={
            items.length === 0 ? null : (
              <Button
                variant="outline"
                onClick={() =>
                  setSearchParams({}, { replace: true })
                }
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
    </div>
  )
}
