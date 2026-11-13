import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ORDERS_CHANGED_EVENT } from '@/lib/events'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

/** Count of orders still waiting for this store's team to handle them. */
export function useNewOrderCount(storeId?: string) {
  const { accessLoading, canManageStore } = useAuth()
  const allowed = Boolean(storeId && canManageStore(storeId))
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !storeId || !allowed) {
      setCount(0)
      return
    }

    const { count: value, error } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('status', 'new')

    if (!error) setCount(value ?? 0)
  }, [allowed, storeId])

  useEffect(() => {
    if (accessLoading) return

    void refresh()
    if (!allowed) return

    const handleFocus = () => {
      void refresh()
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const handleOrdersChanged = () => {
      void refresh()
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener(ORDERS_CHANGED_EVENT, handleOrdersChanged)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener(ORDERS_CHANGED_EVENT, handleOrdersChanged)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [accessLoading, allowed, refresh])

  return count
}
