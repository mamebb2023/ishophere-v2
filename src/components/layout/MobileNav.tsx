import { NavLink } from 'react-router-dom'
import { House, ShoppingCart, UserRound } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const { count } = useCart()
  const { unreadCount } = useNotifications()

  const items = [
    { to: '/', label: 'Home', icon: House, end: true },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: count, tone: 'primary' },
    {
      to: '/account',
      label: 'Account',
      icon: UserRound,
      badge: unreadCount,
      tone: 'destructive',
    },
  ]

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <span
                className={cn(
                  'absolute right-[calc(50%-22px)] top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                  item.tone === 'destructive'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-primary text-primary-foreground',
                )}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
