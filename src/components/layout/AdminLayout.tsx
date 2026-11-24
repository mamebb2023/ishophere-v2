import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Users,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeviceNotificationPrompt } from '@/components/layout/DeviceNotificationPrompt'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { SkipLink } from '@/components/layout/SkipLink'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useNewOrderCount } from '@/hooks/useNewOrderCount'
import { useSeo } from '@/hooks/useSeo'
import { useSettings } from '@/hooks/useSettings'
import { getErrorMessage } from '@/lib/format'
import { getUserDisplayName, getUserEmail, getUserIdentifier } from '@/lib/user'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/items', label: 'Items', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminLayout() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const { count } = useCart()
  const newOrderCount = useNewOrderCount()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const displayName = getUserDisplayName(user, profile)
  const identifier = getUserIdentifier(user, profile)

  useSeo({
    title: 'Admin',
    description: 'Tofik Store shop management.',
    noIndex: true,
  })

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Signed out')
      navigate('/')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <SkipLink />
      <header className="sticky top-0 z-40 border-b bg-background pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-safe">
          <Link to="/admin" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt=""
              className="h-9 w-9 shrink-0 rounded-sm object-cover"
            />
            <span className="text-base font-bold">
              {settings.shop_name} . Admin Panel
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell admin />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/">
                <ExternalLink />
                View Store
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
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Account menu"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-sm font-semibold text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary uppercase">
                      {displayName.slice(0, 1)}
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
                  {isAdmin ? (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <LayoutDashboard />
                        Admin dashboard
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      void handleSignOut()
                    }}
                  >
                    <LogOut />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="h-10">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
        <div className="border-t">
          <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-safe py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.to === '/admin/orders' && newOrderCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {newOrderCount > 99 ? '99+' : newOrderCount}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-safe py-6"
      >
        <Outlet />
      </main>

      <DeviceNotificationPrompt admin />

      <footer className="border-t bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-safe py-4 text-xs text-muted-foreground">
          <span>{getUserEmail(user, profile)}</span>
          <Link to="/" className="hover:text-foreground sm:hidden">
            View shop
          </Link>
        </div>
      </footer>
    </div>
  )
}
