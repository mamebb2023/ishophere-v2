import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ORDERS_CHANGED_EVENT } from '@/lib/events'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

const POLL_INTERVAL_MS = 60_000

/** Count of orders still waiting for the owner to handle them. */
export function useNewOrderCount() {
  const { isAdmin, adminLoading } = useAuth()
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !isAdmin) {
      setCount(0)
      return
    }

    const { count: value, error } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')

    if (!error) setCount(value ?? 0)
  }, [isAdmin])

  useEffect(() => {
    if (adminLoading) return

    void refresh()
    if (!isAdmin) return

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
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, POLL_INTERVAL_MS)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener(ORDERS_CHANGED_EVENT, handleOrdersChanged)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.clearInterval(timer)
    }
  }, [adminLoading, isAdmin, refresh])

  return count
}
