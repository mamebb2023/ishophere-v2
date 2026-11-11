import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'

const currentYear = new Date().getFullYear()

export function Footer() {
  const { settings } = useSettings()

  return (
    <footer className="border-t bg-card/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-8 pb-24 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 md:pb-8">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <span className="font-semibold text-foreground">{settings.shop_name}</span>
          <span className="hidden sm:inline">— mobile-first shopping</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/" className="hover:text-foreground">
            Shop
          </Link>
          <Link to="/cart" className="hover:text-foreground">
            Cart
          </Link>
          <Link to="/account" className="hover:text-foreground">
            Account
          </Link>
          <Link to="/admin/login" className="hover:text-foreground">
            Owner login
          </Link>
        </div>
        <p className="text-xs">
          © {currentYear} {settings.shop_name}
        </p>
      </div>
    </footer>
  )
}
