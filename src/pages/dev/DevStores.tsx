import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ExternalLink,
  LayoutDashboard,
  Pencil,
  Plus,
  RefreshCw,
  Store as StoreIcon,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { formatDate, getErrorMessage } from '@/lib/format'
import { validateStoreSlug } from '@/lib/slug'
import { storeAdminPath, storePath } from '@/lib/storeRoutes'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { DevStoreRow } from '@/lib/types'

export function DevStores() {
  const [stores, setStores] = useState<DevStoreRow[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  const [slugTarget, setSlugTarget] = useState<DevStoreRow | null>(null)
  const [slugValue, setSlugValue] = useState('')
  const [slugError, setSlugError] = useState<string | null>(null)
  const [savingSlug, setSavingSlug] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<DevStoreRow | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  function openSlugDialog(store: DevStoreRow) {
    setSlugTarget(store)
    setSlugValue(store.slug)
    setSlugError(null)
  }

  async function handleSlugSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!slugTarget) return

    const nextSlug = slugValue.trim().toLowerCase()
    const validationError = validateStoreSlug(nextSlug)
    if (validationError) {
      setSlugError(validationError)
      return
    }

    if (nextSlug === slugTarget.slug) {
      setSlugTarget(null)
      return
    }

    setSavingSlug(true)
    setSlugError(null)
    try {
      const { error: rpcError } = await supabase.rpc('update_store_slug', {
        p_store_id: slugTarget.id,
        p_slug: nextSlug,
      })
      if (rpcError) throw rpcError

      toast.success(`${slugTarget.name} moved to /s/${nextSlug}`)
      setSlugTarget(null)
      await load()
    } catch (submitError) {
      setSlugError(getErrorMessage(submitError))
    } finally {
      setSavingSlug(false)
    }
  }

  function openDeleteDialog(store: DevStoreRow) {
    setDeleteTarget(store)
    setDeleteConfirm('')
    setDeleteError(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return

    if (deleteConfirm.trim() !== deleteTarget.slug) {
      setDeleteError(`Type "${deleteTarget.slug}" to confirm.`)
      return
    }

    setDeleting(true)
    setDeleteError(null)
    try {
      const { error: rpcError } = await supabase.rpc('delete_store', {
        p_store_id: deleteTarget.id,
      })
      if (rpcError) throw rpcError

      toast.success(`${deleteTarget.name} deleted`)
      setDeleteTarget(null)
      await load()
    } catch (deleteException) {
      setDeleteError(getErrorMessage(deleteException))
    } finally {
      setDeleting(false)
    }
  }

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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSlugDialog(store)}
                          >
                            <Pencil />
                            Edit slug
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => openDeleteDialog(store)}
                          >
                            <Trash2 />
                            Delete
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openSlugDialog(store)}
                    >
                      <Pencil />
                      Edit slug
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => openDeleteDialog(store)}
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={Boolean(slugTarget)}
        onOpenChange={(open) => {
          if (!open && !savingSlug) setSlugTarget(null)
        }}
      >
        <DialogContent>
          {slugTarget ? (
            <form onSubmit={handleSlugSubmit} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>Edit store slug</DialogTitle>
                <DialogDescription>
                  {slugTarget.name} moves immediately. Links to the old public
                  address will stop working.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="store-slug">Public address</Label>
                <div className="flex items-center rounded-lg border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                  <span className="border-r px-3 py-2 text-sm text-muted-foreground">
                    /s/
                  </span>
                  <input
                    id="store-slug"
                    value={slugValue}
                    onChange={(event) => {
                      setSlugValue(event.target.value)
                      if (slugError) setSlugError(null)
                    }}
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    inputMode="url"
                    placeholder="corner-bakery"
                    className="h-10 w-full rounded-r-lg bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground sm:text-sm"
                  />
                </div>
                {slugError ? (
                  <p className="text-sm text-destructive">{slugError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, and hyphens. Reserved route names
                    cannot be used.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSlugTarget(null)}
                  disabled={savingSlug}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    savingSlug ||
                    !slugValue.trim() ||
                    slugValue.trim().toLowerCase() === slugTarget.slug
                  }
                >
                  {savingSlug ? <Spinner /> : <Pencil />}
                  {savingSlug ? 'Saving…' : 'Save slug'}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          {deleteTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>Delete {deleteTarget.name}?</DialogTitle>
                <DialogDescription>
                  This permanently removes the storefront, its items, categories,
                  orders, and team access. This cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <Alert variant="error" title="This deletes all store data">
                <p>
                  Orders placed at{' '}
                  <span className="font-mono">/s/{deleteTarget.slug}</span> will
                  also be removed for customers.
                </p>
              </Alert>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="delete-confirm">
                  Type{' '}
                  <span className="font-mono font-semibold">
                    {deleteTarget.slug}
                  </span>{' '}
                  to confirm
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirm}
                  onChange={(event) => {
                    setDeleteConfirm(event.target.value)
                    if (deleteError) setDeleteError(null)
                  }}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={deleteTarget.slug}
                />
                {deleteError ? (
                  <p className="text-sm text-destructive">{deleteError}</p>
                ) : null}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void handleDelete()}
                  disabled={
                    deleting || deleteConfirm.trim() !== deleteTarget.slug
                  }
                >
                  {deleting ? <Spinner /> : <Trash2 />}
                  {deleting ? 'Deleting…' : 'Delete store'}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
