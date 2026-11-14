import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  Palette,
  Package,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Store as StoreIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney } from '@/lib/money'
import { storePath } from '@/lib/storeRoutes'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { DEFAULT_STORE_SLUG, type Store } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DemoStore {
  name: string
  brand: string
  brand2: string
  tagline: string
  items: Array<[name: string, priceCents: number]>
}

// Sample storefronts for the hero preview. They only show that every store
// picks its own colors; they are not real stores.
const demoStores: DemoStore[] = [
  {
    name: 'Green Basket',
    brand: '#1d813e',
    brand2: '#50cc60',
    tagline: 'Fresh picks today',
    items: [
      ['Tomatoes', 1200],
      ['Fresh mint', 450],
      ['Olive oil', 3800],
      ['Brown eggs', 2100],
    ],
  },
  {
    name: 'Harbor Books',
    brand: '#1d4ed8',
    brand2: '#38bdf8',
    tagline: 'New on the shelf',
    items: [
      ['Field guide', 5900],
      ['Notebook', 1800],
      ['Fountain pen', 4200],
      ['Bookmarks', 600],
    ],
  },
  {
    name: 'Plum & Thread',
    brand: '#7e22ce',
    brand2: '#c084fc',
    tagline: 'Made to order',
    items: [
      ['Linen scarf', 7400],
      ['Wool socks', 2500],
      ['Tote bag', 3300],
      ['Sewing kit', 1900],
    ],
  },
]

const steps = [
  {
    title: 'Pick a store',
    text: 'Open any storefront from the directory. You can browse without signing in.',
  },
  {
    title: 'Fill your cart',
    text: 'Sign in once to add items. Each store keeps its own cart, so orders never mix.',
  },
  {
    title: 'Place your order',
    text: 'Enter your name and phone. The shop calls to confirm and arrange pickup or delivery.',
  },
]

const ownerTools: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: Package,
    title: 'Items and stock',
    text: 'Add products with photos. An item hides itself when its stock reaches zero.',
  },
  {
    icon: ReceiptText,
    title: 'Orders in one list',
    text: 'Move orders from new to confirmed to shipped. Cancelling puts the stock back.',
  },
  {
    icon: Bell,
    title: 'Order alerts',
    text: 'Your team is notified when an order arrives. Customers see every status change.',
  },
  {
    icon: Palette,
    title: 'Your own colors',
    text: 'Choose your brand colors and the storefront follows.',
  },
]

function StorePreview({ store }: { store: DemoStore }) {
  const style = {
    '--brand': store.brand,
    '--brand-2': store.brand2,
  } as CSSProperties

  return (
    <div
      aria-hidden
      style={style}
      className="w-64 rounded-[2.25rem] border-4 border-foreground bg-background p-3 shadow-xl sm:w-72"
    >
      <div className="flex items-center gap-2 px-1 pb-3 pt-1">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white">
          <ShoppingBag className="h-4 w-4" />
        </span>
        <span className="truncate text-sm font-bold">{store.name}</span>
        <ShoppingCart className="ml-auto h-4 w-4 text-muted-foreground" />
      </div>

      <div className="rounded-xl bg-[linear-gradient(135deg,var(--brand),var(--brand-2))] p-3 text-white">
        <p className="text-sm font-black leading-tight">{store.tagline}</p>
        <p className="mt-0.5 text-[11px] text-white/90">Open now</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {store.items.map(([name, priceCents]) => (
          <div key={name} className="rounded-xl border bg-card p-2">
            <div className="flex aspect-4/3 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <p className="mt-1.5 truncate text-xs font-semibold">{name}</p>
            <p className="text-xs font-bold text-brand">
              {formatMoney(priceCents)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function useFeaturedStores() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let active = true
    void (async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4)

      if (!active) return
      // The landing page works without this list, so errors stay silent.
      if (!error) setStores((data ?? []) as Store[])
      setLoading(false)
    })()

    return () => {
      active = false
    }
  }, [])

  return { stores, loading }
}

export function Landing() {
  const [selected, setSelected] = useState(0)
  const { stores, loading } = useFeaturedStores()
  const preview = demoStores[selected]

  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      <section className="grid items-center gap-10 py-4 lg:grid-cols-[1fr_auto] lg:gap-20 lg:py-10">
        <div className="max-w-xl">
          <h1 className="text-balance text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Shop your local stores with one account.
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
            Browse a store, fill a cart and place your order from your phone.
            The shop confirms by phone, so there is nothing to pay online.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/stores">
                Browse stores
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={storePath(DEFAULT_STORE_SLUG)}>Visit the demo store</Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5">
          <StorePreview store={preview} />
          <div
            role="group"
            aria-label="Preview a store theme"
            className="flex flex-wrap justify-center gap-2"
          >
            {demoStores.map((store, index) => (
              <button
                key={store.name}
                type="button"
                aria-pressed={index === selected}
                onClick={() => setSelected(index)}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  index === selected
                    ? 'border-primary bg-secondary text-secondary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <span
                  aria-hidden
                  className="h-3.5 w-3.5 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${store.brand}, ${store.brand2})`,
                  }}
                />
                {store.name}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Every store sets its own colors.
          </p>
        </div>
      </section>

      {loading || stores.length > 0 ? (
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              Stores on iShopHere
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/stores">See all stores</Link>
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card">
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-[72px] w-full rounded-none" />
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {stores.map((store) => (
                  <Link
                    key={store.id}
                    to={storePath(store.slug)}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{
                        background: `linear-gradient(135deg, ${store.primary_color}, ${store.secondary_color})`,
                      }}
                    >
                      <StoreIcon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold">
                        {store.name}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {store.description}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <h2 className="text-balance text-2xl font-black tracking-tight sm:text-3xl">
          How ordering works
        </h2>
        <ol className="flex flex-col divide-y border-y">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4 py-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {index + 1}
              </span>
              <div>
                <h3 className="text-base font-bold">{step.title}</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground sm:text-base">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <h2 className="text-balance text-2xl font-black tracking-tight sm:text-3xl">
            Run your store from your phone
          </h2>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground sm:text-base">
            Store owners and staff manage everything from the same mobile-first
            admin. Ask the platform owner to open a store for your account.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/admin/login">Owner login</Link>
          </Button>
        </div>
        <ul className="flex flex-col divide-y border-y">
          {ownerTools.map((tool) => (
            <li key={tool.title} className="flex gap-4 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <tool.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold">{tool.title}</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground sm:text-base">
                  {tool.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl bg-[linear-gradient(135deg,var(--brand),var(--brand-2))] px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14">
        <h2 className="max-w-md text-balance text-2xl font-black leading-tight sm:text-4xl">
          Find a store and start shopping.
        </h2>
        <p className="mt-3 max-w-md text-sm text-white/90 sm:text-base">
          One account works in every store.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" variant="secondary" className="font-bold">
            <Link to="/stores">Browse stores</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Link to="/auth">Create an account</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
