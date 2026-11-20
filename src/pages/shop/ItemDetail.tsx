import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  MinusCircle,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { QuantityStepper } from '@/components/shop/QuantityStepper'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import {
  absoluteUrl,
  metaDescription,
  SITE_NAME,
  useSeo,
} from '@/hooks/useSeo'
import { getErrorMessage } from '@/lib/format'
import { formatMoney } from '@/lib/money'
import { setPendingCartAction } from '@/lib/pendingCart'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Item } from '@/lib/types'

export function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { add } = useCart()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  const load = useCallback(async () => {
    if (!id || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('items')
      .select('*, category:categories(id, name, slug)')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      setError(getErrorMessage(fetchError))
    } else {
      setItem(data as unknown as Item | null)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setImageFailed(false)
    setQuantity(1)
  }, [id])

  const fallbackDescription = item
    ? `Buy ${item.name} at ${SITE_NAME}. ${formatMoney(item.price_cents)}. ${
        item.stock > 0 ? 'In stock and ready to order.' : 'Currently out of stock.'
      }`
    : 'Shop everyday essentials at Tofik Store. Browse products, see live prices and stock, and check out quickly with your phone or email.'

  const productJsonLd = item
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: item.name,
        description: item.description ?? fallbackDescription,
        sku: item.id,
        ...(item.image_url ? { image: [absoluteUrl(item.image_url)] } : {}),
        ...(item.category?.name ? { category: item.category.name } : {}),
        brand: { '@type': 'Brand', name: SITE_NAME },
        offers: {
          '@type': 'Offer',
          url: absoluteUrl(`/item/${item.id}`),
          priceCurrency: 'SAR',
          price: (item.price_cents / 100).toFixed(2),
          availability:
            item.is_available && item.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@type': 'Organization', name: SITE_NAME },
        },
      }
    : null

  const breadcrumbJsonLd = item
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: absoluteUrl('/'),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: item.name,
            item: absoluteUrl(`/item/${item.id}`),
          },
        ],
      }
    : null

  useSeo({
    title: item ? item.name : loading ? 'Shop items' : 'Item not found',
    description: metaDescription(item?.description, fallbackDescription),
    path: id ? `/item/${id}` : '/',
    image: item?.image_url,
    type: item ? 'product' : 'website',
    noIndex: !loading && !item,
    jsonLd:
      productJsonLd && breadcrumbJsonLd
        ? [productJsonLd, breadcrumbJsonLd]
        : null,
  })

  async function handleAddToCart() {
    if (!item) return

    if (!user) {
      setPendingCartAction(item.id, quantity)
      toast.info('Sign in to add items to your cart')
      navigate(`/auth?next=${encodeURIComponent(`/item/${item.id}`)}`)
      return
    }

    setAdding(true)
    try {
      await add(item.id, quantity)
      toast.success(`Added ${quantity} × ${item.name} to cart`)
      setQuantity(1)
    } catch (addError) {
      toast.error(getErrorMessage(addError))
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-11 w-48" />
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Item not found"
        description={
          error ?? 'This item may have been removed or is no longer available.'
        }
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link to="/">Back to shop</Link>
            </Button>
            {error ? (
              <Button
                variant="outline"
                onClick={() => {
                  void load()
                }}
              >
                <RefreshCw />
                Try again
              </Button>
            ) : null}
          </div>
        }
      />
    )
  }

  const showImage = Boolean(item.image_url) && !imageFailed
  const soldOut = item.stock <= 0
  const maxQuantity = Math.max(1, Math.min(item.stock, 99))

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shop
      </Link>

      {error ? (
        <Alert variant="error" title="Could not refresh item">
          <p>{error}</p>
        </Alert>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <div className="overflow-hidden rounded-3xl border bg-muted shadow-sm">
          <div className="relative aspect-square">
            {showImage ? (
              <img
                src={item.image_url ?? ''}
                alt={item.name}
                fetchPriority="high"
                decoding="async"
                onError={() => setImageFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <ShoppingBag className="h-12 w-12" />
                <span className="text-sm">No image available</span>
              </div>
            )}
            {soldOut ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Badge variant="muted" className="text-sm">
                  Sold out
                </Badge>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            {item.category ? (
              <Badge variant="secondary">{item.category.name}</Badge>
            ) : null}
            {soldOut ? (
              <Badge variant="destructive">Out of stock</Badge>
            ) : item.stock < 5 ? (
              <Badge variant="warning">
                <MinusCircle className="h-3 w-3" />
                Only {item.stock} left
              </Badge>
            ) : (
              <Badge variant="success">
                <Check className="h-3 w-3" />
                In stock
              </Badge>
            )}
          </div>

          <div>
            <h1 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
              {item.name}
            </h1>
            <p className="mt-2 text-3xl font-semibold text-primary">
              {formatMoney(item.price_cents)}
            </p>
          </div>

          {item.description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
              {item.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No description provided for this item.
            </p>
          )}

          <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Quantity</p>
                <p className="text-xs text-muted-foreground">
                  {soldOut
                    ? 'This item is currently unavailable.'
                    : `${item.stock} available`}
                </p>
              </div>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                max={maxQuantity}
                disabled={soldOut}
              />
            </div>

            <Button
              size="lg"
              className="mt-4 w-full"
              disabled={soldOut || adding}
              onClick={() => {
                void handleAddToCart()
              }}
            >
              {adding ? <Spinner /> : <ShoppingCart />}
              {soldOut
                ? 'Out of stock'
                : user
                  ? `Add to cart · ${formatMoney(item.price_cents * quantity)}`
                  : 'Sign in to add to cart'}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              No online payment required — the shop confirms your order.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
