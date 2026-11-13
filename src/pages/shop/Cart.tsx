import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  PackageX,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { QuantityStepper } from '@/components/shop/QuantityStepper'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCart } from '@/hooks/useCart'
import { getErrorMessage } from '@/lib/format'
import { formatMoney } from '@/lib/money'

export function Cart() {
  const {
    lines,
    count,
    subtotalCents,
    loading,
    error,
    setQuantity,
    remove,
    refresh,
  } = useCart()
  const [busyItem, setBusyItem] = useState<string | null>(null)

  async function handleQuantity(itemId: string, quantity: number) {
    setBusyItem(itemId)
    try {
      await setQuantity(itemId, quantity)
    } catch (updateError) {
      toast.error(getErrorMessage(updateError))
    } finally {
      setBusyItem(null)
    }
  }

  async function handleRemove(itemId: string, name: string) {
    setBusyItem(itemId)
    try {
      await remove(itemId)
      toast.success(`Removed ${name}`)
    } catch (removeError) {
      toast.error(getErrorMessage(removeError))
    } finally {
      setBusyItem(null)
    }
  }

  const hasOverstock = lines.some(
    (line) => line.item && line.quantity > line.item.stock,
  )

  if (loading && lines.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Browse the shop and add a few items to get started."
        action={
          <Button asChild>
            <Link to="/">
              <ShoppingBag />
              Browse items
            </Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Your cart
          </h1>
          <p className="text-sm text-muted-foreground">
            {count} item{count === 1 ? '' : 's'} ready for checkout
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/">Keep shopping</Link>
        </Button>
      </div>

      {error ? (
        <Alert variant="error" title="Cart could not be refreshed">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              void refresh()
            }}
          >
            <RefreshCw />
            Retry
          </Button>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-3">
          {lines.map((line) => {
            if (!line.item) {
              return (
                <Card key={line.id} className="border-dashed">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <PackageX className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">Item unavailable</p>
                      <p className="text-xs text-muted-foreground">
                        This item was removed from the shop.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove unavailable item"
                      onClick={() => {
                        void handleRemove(line.item_id, 'unavailable item')
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </CardContent>
                </Card>
              )
            }

            const item = line.item
            const busy = busyItem === line.item_id
            return (
              <Card key={line.id}>
                <CardContent className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                  <Link
                    to={`/item/${item.id}`}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-24"
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ShoppingBag className="h-6 w-6" />
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/item/${item.id}`}
                          className="line-clamp-2 text-sm font-semibold hover:underline sm:text-base"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatMoney(item.price_cents)} each
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${item.name}`}
                        disabled={busy}
                        onClick={() => {
                          void handleRemove(item.id, item.name)
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                      <QuantityStepper
                        value={line.quantity}
                        onChange={(quantity) => {
                          void handleQuantity(item.id, quantity)
                        }}
                        max={Math.max(1, Math.min(item.stock, 99))}
                        disabled={busy || item.stock <= 0}
                      />
                      <span className="text-sm font-bold text-primary sm:text-base">
                        {formatMoney(item.price_cents * line.quantity)}
                      </span>
                    </div>
                    {line.quantity > item.stock ? (
                      <p className="text-xs text-destructive">
                        Only {item.stock} left — reduce the quantity before
                        checkout.
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="sticky bottom-24 z-10 border-primary/20 shadow-md lg:static lg:shadow-sm">
            <CardContent className="space-y-4 p-5">
              <h2 className="text-lg font-bold">Order summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatMoney(subtotalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-semibold">Pay on confirmation</span>
                </div>
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatMoney(subtotalCents)}</span>
                </div>
              </div>
              {hasOverstock ? (
                <Button size="lg" className="w-full" disabled>
                  Reduce quantities to continue
                </Button>
              ) : (
                <Button asChild size="lg" className="w-full">
                  <Link to="/checkout">
                    Checkout
                    <ArrowRight />
                  </Link>
                </Button>
              )}
              <p className="text-center text-xs text-muted-foreground">
                The shop will contact you to confirm fulfillment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
