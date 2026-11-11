import { createContext } from 'react'
import type { Notification } from '@/lib/types'

export interface NotificationsContextValue {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  refresh: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  markOrderRead: (orderId: string) => Promise<void>
  isOrderUnread: (orderId: string) => boolean
}

export const NotificationsContext =
  createContext<NotificationsContextValue | null>(null)
