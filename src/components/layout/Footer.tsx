import { Capacitor } from '@capacitor/core'
import { Link } from 'react-router-dom'
import { useSettings } from '@/hooks/useSettings'

const currentYear = new Date().getFullYear()
const native = Capacitor.isNativePlatform()

export function Footer() {
  const { settings } = useSettings()

  return (
    <footer className="hidden border-t bg-card/60 sm:block">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-safe pt-5 pb-20 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:pb-6">
        {/* Mobile: logo + store name on the left, © + Privacy on the right. Desktop:
            the wrapper dissolves so these become the outer row's ends. */}
        <div className="flex w-full items-center justify-between gap-4 sm:contents">
          <div className="flex items-center gap-2 sm:order-1">
            <img
              src="/logo.png"
              alt=""
              className="h-7 w-7 rounded-sm object-cover"
            />
            <span className="font-semibold text-foreground">{settings.shop_name}</span>
          </div>
          <div className="flex items-center gap-1 sm:order-3">
            <Link to="/privacy" className="text-xs hover:text-foreground">
              Privacy
            </Link>
            <span className="text-xs text-muted-foreground">·</span>
            <p className="text-xs">
              © {currentYear} {settings.shop_name}
            </p>
          </div>
        </div>
        <nav
          aria-label="Footer"
          className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:order-2 sm:w-auto sm:justify-start sm:gap-4"
        >
          <Link to="/" className="hover:text-foreground">
            Shop
          </Link>
          <Link to="/cart" className="hover:text-foreground">
            Cart
          </Link>
          <Link to="/account" className="hover:text-foreground">
            Account
          </Link>
          {!native && (
            <Link to="/download" className="hover:text-foreground">
              Android app
            </Link>
          )}
        </nav>
      </div>
    </footer>
  )
}
