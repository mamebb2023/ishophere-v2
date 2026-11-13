import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CartContext } from '@/contexts/cart-context'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/hooks/useStore'
import { getErrorMessage } from '@/lib/format'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { CartLine } from '@/lib/types'

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { store } = useStore()
  const userId = user?.id
  const storeId = store.id
  const [lines, setLines] = useState<CartLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !userId) {
      setLines([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('cart_items')
      .select(
        'id, user_id, store_id, item_id, quantity, created_at, item:items(*)',
      )
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(getErrorMessage(fetchError))
    } else {
      setError(null)
      setLines((data ?? []) as unknown as CartLine[])
    }
    setLoading(false)
  }, [storeId, userId])

  useEffect(() => {
    setLines([])
    setError(null)
    void refresh()
  }, [refresh])

  const add = useCallback(
    async (itemId: string, quantity = 1) => {
      if (!userId) throw new Error('Please sign in to add items to your cart.')
      const { error: rpcError } = await supabase.rpc('add_to_cart', {
        p_item_id: itemId,
        p_qty: quantity,
      })
      if (rpcError) throw rpcError
      await refresh()
    },
    [userId, refresh],
  )

  const remove = useCallback(
    async (itemId: string) => {
      if (!userId) throw new Error('Please sign in first.')
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('store_id', storeId)
        .eq('item_id', itemId)

      if (deleteError) throw deleteError
      await refresh()
    },
    [storeId, userId, refresh],
  )

  const setQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!userId) throw new Error('Please sign in first.')
      if (quantity <= 0) {
        await remove(itemId)
        return
      }

      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', userId)
        .eq('store_id', storeId)
        .eq('item_id', itemId)

      if (updateError) throw updateError
      await refresh()
    },
    [storeId, userId, refresh, remove],
  )

  const { count, subtotalCents } = useMemo(() => {
    let quantity = 0
    let subtotal = 0
    for (const line of lines) {
      quantity += line.quantity
      if (line.item) subtotal += line.item.price_cents * line.quantity
    }
    return { count: quantity, subtotalCents: subtotal }
  }, [lines])

  const value = useMemo(
    () => ({
      lines,
      count,
      subtotalCents,
      loading,
      error,
      add,
      setQuantity,
      remove,
      refresh,
    }),
    [lines, count, subtotalCents, loading, error, add, setQuantity, remove, refresh],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
