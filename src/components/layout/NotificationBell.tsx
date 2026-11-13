import { useNavigate } from 'react-router-dom'
import { Bell, PackageCheck, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { formatRelativeTime } from '@/lib/format'
import { storeAdminPath, storePath } from '@/lib/storeRoutes'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/types'

export function NotificationBell({
  admin = false,
  storeId,
  storeSlug,
}: {
  admin?: boolean
  storeId?: string
  storeSlug?: string
}) {
  const { user } = useAuth()
  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useNotifications()
  const navigate = useNavigate()

  const visibleNotifications = storeId
    ? notifications.filter(
        (notification) => notification.store_id === storeId,
      )
    : notifications
  const visibleUnread = storeId
    ? visibleNotifications.filter((notification) => !notification.read_at)
        .length
    : unreadCount

  if (!user) return null

  function openNotification(notification: Notification) {
    if (!notification.read_at) void markRead(notification.id)
    if (!notification.order_id) return

    const slug = notification.store?.slug ?? storeSlug

    // New-order alerts belong to the store team, so send them to the store's
    // admin orders page instead of a customer-facing order page.
    if (admin || notification.type === 'order_placed') {
      if (slug) navigate(storeAdminPath(slug, 'orders'))
      return
    }

    navigate(
      slug ? storePath(slug, `/order/${notification.order_id}`) : '/account',
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            visibleUnread > 0
              ? `Notifications, ${visibleUnread} unread`
              : 'Notifications'
          }
        >
          <Bell className="h-5 w-5" />
          {visibleUnread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
              {visibleUnread > 99 ? '99+' : visibleUnread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-w-[calc(100vw_-_1rem)] p-0"
      >
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Notifications</span>
            {visibleUnread > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {visibleUnread > 99 ? '99+' : visibleUnread}
              </span>
            ) : null}
          </div>
          {visibleUnread > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead(storeId)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="max-h-[min(24rem,60vh)] overflow-y-auto p-1">
          {loading && visibleNotifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Loading notifications…
            </p>
          ) : visibleNotifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Bell className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground">
                Order updates will appear here.
              </p>
            </div>
          ) : (
            visibleNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onSelect={() => openNotification(notification)}
                className="items-start gap-3 px-2.5 py-2.5"
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    notification.type === 'order_placed'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {notification.type === 'order_placed' ? (
                    <ShoppingBag className="h-4 w-4" />
                  ) : (
                    <PackageCheck className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-2">
                    <span
                      className={cn(
                        'flex-1 text-sm leading-snug',
                        notification.read_at
                          ? 'font-medium text-muted-foreground'
                          : 'font-semibold text-foreground',
                      )}
                    >
                      {notification.title}
                    </span>
                    {!notification.read_at ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-destructive" />
                    ) : null}
                  </span>
                  {notification.body ? (
                    <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                      {notification.body}
                    </span>
                  ) : null}
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
