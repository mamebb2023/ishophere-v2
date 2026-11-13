import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useOptionalStore } from '@/hooks/useOptionalStore'
import { storePath } from '@/lib/storeRoutes'

const currentYear = new Date().getFullYear()

export function Footer() {
  const store = useOptionalStore()?.store ?? null

  return (
    <footer className="border-t bg-card/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-8 pb-24 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 md:pb-8">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <span className="font-semibold text-foreground">
            {store?.name ?? 'iShopHere'}
          </span>
          <span className="hidden sm:inline">
            {store ? '— mobile-first shopping' : '— one account, every store'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {store ? (
            <>
              <Link to={storePath(store.slug)} className="hover:text-foreground">
                Shop
              </Link>
              <Link
                to={storePath(store.slug, 'cart')}
                className="hover:text-foreground"
              >
                Cart
              </Link>
            </>
          ) : (
            <Link to="/stores" className="hover:text-foreground">
              Stores
            </Link>
          )}
          <Link to="/account" className="hover:text-foreground">
            Account
          </Link>
          <Link to="/admin/login" className="hover:text-foreground">
            Owner login
          </Link>
        </div>
        <p className="text-xs">
          © {currentYear} {store?.name ?? 'iShopHere'}
        </p>
      </div>
    </footer>
  )
}
