import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  PackageX,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/lib/format'
import { formatMoney } from '@/lib/money'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Item } from '@/lib/types'

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <Badge variant="destructive">Out of stock</Badge>
  if (stock < 5) return <Badge variant="warning">{stock} left</Badge>
  return <Badge variant="success">{stock} in stock</Badge>
}

export function AdminItems() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('items')
      .select('*, category:categories(id, name, slug)')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(getErrorMessage(fetchError))
    } else {
      setItems((data ?? []) as unknown as Item[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return items
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        (item.category?.name ?? '').toLowerCase().includes(needle),
    )
  }, [items, query])

  async function handleRemoveFromShop(item: Item) {
    setBusyId(item.id)
    try {
      const { error: updateError } = await supabase
        .from('items')
        .update({ stock: 0 })
        .eq('id', item.id)
      if (updateError) throw updateError
      toast.success(`${item.name} removed from the shop`)
      await load()
    } catch (updateError) {
      toast.error(getErrorMessage(updateError))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(item: Item) {
    const confirmed = window.confirm(
      `Delete "${item.name}" permanently? Items with order history cannot be deleted.`,
    )
    if (!confirmed) return

    setBusyId(item.id)
    try {
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id)
      if (deleteError) throw deleteError
      toast.success(`${item.name} deleted`)
      await load()
    } catch (deleteError) {
      toast.error(
        `${getErrorMessage(deleteError)} — if this item has orders, set stock to 0 instead.`,
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Items"
        description="Add products, update stock, and control availability."
        action={
          <Button asChild>
            <Link to="/admin/items/new">
              <Plus />
              Add item
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search items…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw />
          Refresh
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} item{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {error ? (
        <Alert variant="error" title="Could not load items" className="mb-4">
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
          icon={Package}
          title={items.length === 0 ? 'No items yet' : 'No matching items'}
          description={
            items.length === 0
              ? 'Add your first product to start selling.'
              : 'Try a different search term.'
          }
          action={
            items.length === 0 ? (
              <Button asChild>
                <Link to="/admin/items/new">
                  <Plus />
                  Add item
                </Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <Package className="h-5 w-5" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-64 truncate font-semibold">
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.is_available ? 'Visible' : 'Hidden'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.category?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {formatMoney(item.price_cents)}
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge stock={item.stock} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon-sm">
                            <Link
                              to={`/admin/items/${item.id}/edit`}
                              aria-label={`Edit ${item.name}`}
                            >
                              <Pencil />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove ${item.name} from shop`}
                            disabled={busyId === item.id || item.stock === 0}
                            onClick={() => void handleRemoveFromShop(item)}
                          >
                            <PackageX />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            aria-label={`Delete ${item.name}`}
                            disabled={busyId === item.id}
                            onClick={() => void handleDelete(item)}
                          >
                            <Trash2 />
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
            {filtered.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex gap-3 p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Package className="h-6 w-6" />
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.category?.name ?? 'No category'}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold">
                        {formatMoney(item.price_cents)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <StockBadge stock={item.stock} />
                      <div className="flex gap-1">
                        <Button asChild variant="ghost" size="icon-sm">
                          <Link
                            to={`/admin/items/${item.id}/edit`}
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${item.name} from shop`}
                          disabled={busyId === item.id || item.stock === 0}
                          onClick={() => void handleRemoveFromShop(item)}
                        >
                          <PackageX />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete ${item.name}`}
                          disabled={busyId === item.id}
                          onClick={() => void handleDelete(item)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
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
