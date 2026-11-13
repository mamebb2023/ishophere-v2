import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store as StoreIcon,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/layout/NotificationBell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useOptionalCart } from '@/hooks/useOptionalCart'
import { useOptionalStore } from '@/hooks/useOptionalStore'
import { getErrorMessage } from '@/lib/format'
import { storeAdminPath, storePath } from '@/lib/storeRoutes'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-secondary text-secondary-foreground'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
  }`

export function Header() {
  const storeContext = useOptionalStore()
  const cart = useOptionalCart()
  const {
    user,
    isDev,
    isAdmin,
    memberships,
    canManageStore,
    signOut,
  } = useAuth()
  const navigate = useNavigate()

  const store = storeContext?.store ?? null
  const count = cart?.count ?? 0
  const homeHref = store ? storePath(store.slug) : '/'
  const canManageCurrentStore = store ? canManageStore(store.id) : false
  const adminHref =
    store && canManageCurrentStore ? storeAdminPath(store.slug) : '/admin'

  const roleLabel = isDev
    ? 'Platform owner'
    : memberships.some((membership) => membership.role === 'owner')
      ? 'Store owner'
      : memberships.length > 0
        ? 'Store team'
        : 'Customer'

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
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to={homeHref} className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="truncate text-base font-bold tracking-tight sm:text-lg">
            {store?.name ?? 'iShopHere'}
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {store ? (
            <>
              <NavLink to={storePath(store.slug)} end className={navLinkClass}>
                Shop
              </NavLink>
              <NavLink
                to={storePath(store.slug, 'cart')}
                className={navLinkClass}
              >
                Cart
              </NavLink>
            </>
          ) : (
            <NavLink to="/stores" className={navLinkClass}>
              Stores
            </NavLink>
          )}

          {isAdmin || canManageCurrentStore ? (
            <NavLink to={adminHref} className={navLinkClass}>
              Admin
            </NavLink>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <NotificationBell storeId={store?.id} storeSlug={store?.slug} />
          {store ? (
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link
                to={storePath(store.slug, 'cart')}
                aria-label={`Cart, ${count} items`}
              >
                <ShoppingCart className="h-5 w-5" />
                {count > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                    {count > 99 ? '99+' : count}
                  </span>
                ) : null}
              </Link>
            </Button>
          ) : null}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account menu"
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-sm font-semibold text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary uppercase">
                    {(user.email ?? 'U').slice(0, 1)}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="normal-case tracking-normal">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {user.email}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {roleLabel}
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
                  <Link to="/stores">
                    <StoreIcon />
                    Browse stores
                  </Link>
                </DropdownMenuItem>
                {store ? (
                  <DropdownMenuItem asChild>
                    <Link to={storePath(store.slug, 'cart')}>
                      <ShoppingCart />
                      Cart
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {isAdmin || canManageCurrentStore ? (
                  <DropdownMenuItem asChild>
                    <Link to={adminHref}>
                      <LayoutDashboard />
                      Admin dashboard
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {isDev ? (
                  <DropdownMenuItem asChild>
                    <Link to="/dev">
                      <ShieldCheck />
                      Dev console
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
    </header>
  )
}
