import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  FolderTree,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { getErrorMessage } from '@/lib/format'
import { slugify } from '@/lib/slug'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Category } from '@/lib/types'

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (fetchError) {
      setError(getErrorMessage(fetchError))
    } else {
      setCategories((data ?? []) as Category[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function resetForm() {
    setName('')
    setSortOrder(0)
    setEditingId(null)
  }

  function startEdit(category: Category) {
    setEditingId(category.id)
    setName(category.name)
    setSortOrder(category.sort_order)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      toast.error('Category name must be at least 2 characters')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: trimmed,
        slug: slugify(trimmed),
        sort_order: sortOrder,
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingId)
        if (updateError) throw updateError
        toast.success('Category updated')
      } else {
        const { error: insertError } = await supabase
          .from('categories')
          .insert(payload)
        if (insertError) throw insertError
        toast.success('Category created')
      }

      resetForm()
      await load()
    } catch (submitError) {
      toast.error(getErrorMessage(submitError))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(category: Category) {
    const confirmed = window.confirm(
      `Delete "${category.name}"? Items in this category will become uncategorized.`,
    )
    if (!confirmed) return

    setBusyId(category.id)
    try {
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)
      if (deleteError) throw deleteError
      toast.success(`${category.name} deleted`)
      if (editingId === category.id) resetForm()
      await load()
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError))
    } finally {
      setBusyId(null)
    }
  }

  const slugPreview = name.trim() ? slugify(name) : 'category-slug'

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Group items so customers can browse quickly."
        action={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw />
            Refresh
          </Button>
        }
      />

      {error ? (
        <Alert variant="error" title="Could not load categories" className="mb-4">
          <p>{error}</p>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{editingId ? 'Edit category' : 'New category'}</CardTitle>
            {editingId ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Cancel editing"
                onClick={resetForm}
              >
                <X />
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Bakery"
                  maxLength={80}
                />
                <p className="text-xs text-muted-foreground">
                  Slug: <span className="font-mono">{slugPreview}</span>
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category-sort">Sort order</Label>
                <Input
                  id="category-sort"
                  type="number"
                  min={0}
                  step={1}
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(Math.max(0, Number(event.target.value) || 0))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first.
                </p>
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? <Spinner /> : editingId ? <Save /> : <Plus />}
                {saving
                  ? 'Saving…'
                  : editingId
                    ? 'Save changes'
                    : 'Add category'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={FolderTree}
              title="No categories yet"
              description="Create a category to organize your items."
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="divide-y">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                      <FolderTree className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {category.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        /{category.slug} · order {category.sort_order}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${category.name}`}
                      onClick={() => startEdit(category)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Delete ${category.name}`}
                      disabled={busyId === category.id}
                      onClick={() => void handleDelete(category)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
