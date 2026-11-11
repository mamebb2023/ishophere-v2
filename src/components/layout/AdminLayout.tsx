import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { useAuth } from '@/hooks/useAuth'
import { useNewOrderCount } from '@/hooks/useNewOrderCount'
import { getErrorMessage } from '@/lib/format'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/items', label: 'Items', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminLayout() {
  const { user, signOut } = useAuth()
  const newOrderCount = useNewOrderCount()
  const navigate = useNavigate()

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/admin/login')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <span className="text-base font-bold">Admin</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell admin />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/">
                <ExternalLink />
                View shop
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                void handleSignOut()
              }}
              aria-label="Sign out"
            >
              <LogOut />
            </Button>
          </div>
        </div>
        <div className="border-t">
          <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <span>{user?.email}</span>
          <Link to="/" className="hover:text-foreground sm:hidden">
            View shop
          </Link>
        </div>
      </footer>
    </div>
  )
}
