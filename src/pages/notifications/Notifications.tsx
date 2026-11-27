import { useNavigate } from "react-router-dom";
import { BellRing, CheckCheck, PackageCheck, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSeo } from "@/hooks/useSeo";
import type { Notification } from "@/lib/types";

export function NotificationsPage() {
  const { user, isAdmin } = useAuth();
  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useNotifications();
  const navigate = useNavigate();

  useSeo({
    title: "Notifications",
    description: "Order updates and alerts for your Tofik Store account.",
    path: "/notifications",
    noIndex: true,
  });

  if (!user) return null;

  function openNotification(notification: Notification) {
    if (!notification.read_at) void markRead(notification.id);
    if (!notification.order_id) return;

    navigate(isAdmin ? "/admin/orders" : `/order/${notification.order_id}`);
  }

  return (
    <div className="flex w-full max-w-4xl mx-auto flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 p-2 sm:p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BellRing className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Notifications
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
              : "You’re all caught up."}
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void markAllRead()}
            disabled={loading}
          >
            <CheckCheck />
            Mark all read
          </Button>
        ) : null}
      </div>

      <Card className="overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            Loading notifications…
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BellRing className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-xs text-muted-foreground">
              Order updates will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {notifications.map((notification) => {
              const isOrderPlaced = notification.type === "order_placed";

              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-3.5 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none sm:px-4",
                      !notification.read_at && "bg-primary/3",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        isOrderPlaced
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isOrderPlaced ? (
                        <ShoppingBag className="h-4 w-4" />
                      ) : (
                        <PackageCheck className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span
                          className={cn(
                            "flex-1 text-sm leading-snug",
                            notification.read_at
                              ? "font-medium text-muted-foreground"
                              : "font-semibold text-foreground",
                          )}
                        >
                          {notification.title}
                        </span>
                        {!notification.read_at ? (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destructive">
                            <span className="sr-only">Unread</span>
                          </span>
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
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
