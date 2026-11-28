import { Capacitor } from '@capacitor/core'
import { Link } from 'react-router-dom'
import { useSettings } from '@/hooks/useSettings'

const currentYear = new Date().getFullYear()
const native = Capacitor.isNativePlatform()

export function Footer() {
  const { settings } = useSettings()

  return (
    <footer className="mt-8 hidden w-full sm:block">
      <div className="mx-auto w-full max-w-7xl px-safe">
        <div className="relative overflow-hidden rounded-t-3xl bg-[linear-gradient(135deg,var(--brand),var(--brand-2))] px-6 pt-10 pb-20 text-white shadow-lg sm:px-10 md:pb-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 left-1/3 h-44 w-44 rounded-full bg-black/10"
          />

          <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt=""
                  className="h-9 w-9 rounded-lg bg-white/15 object-cover p-0.5 shadow-sm"
                />
                <span className="text-base font-bold tracking-tight">
                  {settings.shop_name}
                </span>
              </Link>
              <p className="max-w-xs text-xs leading-relaxed text-white/80">
                Quality products and everyday essentials — clear prices, live
                stock, and fast delivery.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-accent">
                Shop
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-white/85">
                <li>
                  <Link to="/items" className="hover:text-white">
                    All items
                  </Link>
                </li>
                <li>
                  <Link to="/items?sort=newest" className="hover:text-white">
                    New arrivals
                  </Link>
                </li>
                <li>
                  <Link to="/items?sort=price-asc" className="hover:text-white">
                    Best value
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-accent">
                Quick Links
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-white/85">
                <li>
                  <Link to="/account" className="hover:text-white">
                    My Account
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="hover:text-white">
                    Cart
                  </Link>
                </li>
                <li>
                  <Link to="/notifications" className="hover:text-white">
                    Notifications
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-accent">
                Site Links
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-white/85">
                <li>
                  <Link to="/" className="hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                {!native ? (
                  <li>
                    <Link to="/download" className="hover:text-white">
                      Android App
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>

          <div className="relative mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-5 text-xs text-white/75">
            <p>
              Copyright © {currentYear} | {settings.shop_name}
            </p>
            <Link to="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
