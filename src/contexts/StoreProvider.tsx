import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Store as StoreIcon } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { FullPageLoader } from '@/components/ui/spinner'
import {
  StoreContext,
  type StoreContextValue,
} from '@/contexts/store-context'
import { getErrorMessage } from '@/lib/format'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { applyStoreTheme, resetStoreTheme } from '@/lib/theme'
import type { Store } from '@/lib/types'

export function StoreProvider({
  slug,
  children,
}: {
  slug: string
  children: ReactNode
}) {
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshStore = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      setError('Supabase is not configured.')
      setStore(null)
      return null
    }

    if (!slug) {
      setLoading(false)
      setError('This store does not exist.')
      setStore(null)
      return null
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (fetchError) {
      setError(getErrorMessage(fetchError))
      setStore(null)
    } else if (!data) {
      setError('This store does not exist or is not available.')
      setStore(null)
    } else {
      setStore(data as Store)
    }

    setLoading(false)
    return (data ?? null) as Store | null
  }, [slug])

  useEffect(() => {
    void refreshStore()
  }, [refreshStore])

  useEffect(() => {
    if (store) applyStoreTheme(store)
    return () => resetStoreTheme()
  }, [store])

  const saveStore = useCallback<StoreContextValue['saveStore']>(
    async (values) => {
      if (!store) throw new Error('Store is not loaded.')

      const { data, error: updateError } = await supabase
        .from('stores')
        .update(values)
        .eq('id', store.id)
        .select('*')
        .single()

      if (updateError) throw updateError
      if (data) setStore(data as Store)
    },
    [store],
  )

  const value = useMemo<StoreContextValue | null>(
    () =>
      store
        ? { store, loading: false, error, refreshStore, saveStore }
        : null,
    [store, error, refreshStore, saveStore],
  )

  if (loading) {
    return <FullPageLoader label="Loading store…" />
  }

  if (!store || !value) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-12">
        <EmptyState
          icon={StoreIcon}
          title="Store not found"
          description={error ?? 'This store does not exist or is not available.'}
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link to="/stores">Browse stores</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void refreshStore()
                }}
              >
                Try again
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
