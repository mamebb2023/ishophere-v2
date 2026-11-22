import { Link } from 'react-router-dom'
import { useSettings } from '@/hooks/useSettings'

const currentYear = new Date().getFullYear()

export function Footer() {
  const { settings } = useSettings()

  return (
    <footer className="border-t bg-card/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-safe pt-8 pb-24 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:pb-8">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt=""
            className="h-7 w-7 rounded-sm object-cover"
          />
          <span className="font-semibold text-foreground">{settings.shop_name}</span>
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
          <Link to="/download" className="hover:text-foreground">
            Android app
          </Link>
        </div>
        <p className="text-xs">
          © {currentYear} {settings.shop_name}
        </p>
      </div>
    </footer>
  )
}
