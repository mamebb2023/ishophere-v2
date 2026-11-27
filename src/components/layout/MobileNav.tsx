import { NavLink } from "react-router-dom";
import { Bell, House, ShoppingCart, UserRound } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const { count } = useCart();
  const { unreadCount } = useNotifications();

  const items = [
    { to: "/", label: "Home", icon: House, end: true },
    {
      to: "/cart",
      label: "Cart",
      icon: ShoppingCart,
      badge: count,
      tone: "primary",
    },
    {
      to: "/notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadCount,
      tone: "destructive",
    },
    {
      to: "/account",
      label: "Account",
      icon: UserRound,
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 min-h-16 border-t bg-background md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "relative flex min-h-13 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-all duration-150 active:scale-95 motion-reduce:active:scale-100",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <span
                className={cn(
                  "absolute right-[calc(50%-22px)] top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                  item.tone === "destructive"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
