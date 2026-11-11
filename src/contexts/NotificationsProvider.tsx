import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { NotificationsContext } from '@/contexts/notifications-context'
import { useAuth } from '@/hooks/useAuth'
import { ORDERS_CHANGED_EVENT } from '@/lib/events'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/types'

const LIST_LIMIT = 30
const POLL_INTERVAL_MS = 60_000

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !userId) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    setLoading(true)
    const [listResult, countResult] = await Promise.all([
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(LIST_LIMIT),
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null),
    ])

    // A missing notifications table (migration 0002 not applied yet) should
    // not break the rest of the app, so errors are handled silently.
    if (!listResult.error) {
      setNotifications((listResult.data ?? []) as Notification[])
    }
    if (!countResult.error) {
      setUnreadCount(countResult.count ?? 0)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    setNotifications([])
    setUnreadCount(0)
    void refresh()

    if (!userId) return

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
  }, [refresh, userId])

  const markRead = useCallback(
    async (id: string) => {
      if (!userId) return

      const target = notifications.find((notification) => notification.id === id)
      const now = new Date().toISOString()

      if (!target?.read_at) {
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === id && !notification.read_at
              ? { ...notification, read_at: now }
              : notification,
          ),
        )
        setUnreadCount((current) => Math.max(0, current - 1))
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('id', id)
        .eq('user_id', userId)
        .is('read_at', null)

      if (error) await refresh()
    },
    [notifications, refresh, userId],
  )

  const markAllRead = useCallback(async () => {
    if (!userId) return

    const now = new Date().toISOString()
    setNotifications((current) =>
      current.map((notification) =>
        notification.read_at ? notification : { ...notification, read_at: now },
      ),
    )
    setUnreadCount(0)

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', userId)
      .is('read_at', null)

    if (error) await refresh()
  }, [refresh, userId])

  const markOrderRead = useCallback(
    async (orderId: string) => {
      if (!userId) return

      const now = new Date().toISOString()
      const localUnread = notifications.filter(
        (notification) =>
          notification.order_id === orderId && !notification.read_at,
      ).length

      setNotifications((current) => {
        let changed = false
        const next = current.map((notification) => {
          if (notification.order_id !== orderId || notification.read_at) {
            return notification
          }
          changed = true
          return { ...notification, read_at: now }
        })
        return changed ? next : current
      })
      setUnreadCount((current) => Math.max(0, current - localUnread))

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('user_id', userId)
        .eq('order_id', orderId)
        .is('read_at', null)

      // When the list had not loaded yet, refresh to sync the badge with the
      // notifications that the update just marked on the server.
      if (error || localUnread === 0) await refresh()
    },
    [notifications, refresh, userId],
  )

  const isOrderUnread = useCallback(
    (orderId: string) =>
      notifications.some(
        (notification) =>
          notification.order_id === orderId && !notification.read_at,
      ),
    [notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refresh,
      markRead,
      markAllRead,
      markOrderRead,
      isOrderUnread,
    }),
    [
      notifications,
      unreadCount,
      loading,
      refresh,
      markRead,
      markAllRead,
      markOrderRead,
      isOrderUnread,
    ],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}
