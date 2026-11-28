import { Link } from 'react-router-dom'
import {
  Bell,
  LayoutDashboard,
  ShoppingCart,
  User,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useNotifications } from '@/hooks/useNotifications'
import { useSettings } from '@/hooks/useSettings'
import { getUserDisplayName, getUserIdentifier } from '@/lib/user'

export function Header() {
  const { user, profile, isAdmin } = useAuth()
  const { count } = useCart()
  const { unreadCount } = useNotifications()
  const { settings } = useSettings()
  const displayName = getUserDisplayName(user, profile)
  const identifier = getUserIdentifier(user, profile)

  return (
    <header className="sticky top-0 z-40 border-b bg-background pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-safe">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src="/logo.png"
            alt=""
            className="h-9 w-9 shrink-0 rounded-sm object-cover shadow-sm"
          />
          <span className="truncate text-base font-bold tracking-tight sm:text-lg">
            {settings.shop_name}
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden md:flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link
                to="/notifications"
                aria-label={
                  unreadCount > 0
                    ? `Notifications, ${unreadCount} unread`
                    : 'Notifications'
                }
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link to="/cart" aria-label={`Cart, ${count} items`}>
                <ShoppingCart className="h-5 w-5" />
                {count > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                    {count > 99 ? '99+' : count}
                  </span>
                ) : null}
              </Link>
            </Button>
          </div>

          {user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account menu"
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg transition-[background-color,scale] duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 aria-expanded:bg-accent motion-reduce:active:scale-100"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <User className="h-5 w-5" />
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="normal-case tracking-normal">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {identifier && identifier !== displayName
                      ? `${identifier} · `
                      : ''}
                    {isAdmin ? 'Shop owner' : 'Customer'}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <UserRound />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/cart">
                    <ShoppingCart />
                    Cart
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notifications">
                    <Bell />
                    Notifications
                    {unreadCount > 0 ? (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    ) : null}
                  </Link>
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <LayoutDashboard />
                      Admin dashboard
                    </Link>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="h-10">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
