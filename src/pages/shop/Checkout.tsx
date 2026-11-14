import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Lock, ShoppingBag, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useStore } from '@/hooks/useStore'
import { notifyOrdersChanged } from '@/lib/events'
import { getErrorMessage } from '@/lib/format'
import { formatMoney } from '@/lib/money'
import { storePath } from '@/lib/storeRoutes'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(2, 'Enter your full name')
    .max(120, 'Name is too long'),
  customer_phone: z
    .string()
    .trim()
    .min(7, 'Enter a valid phone number')
    .max(32, 'Phone number is too long')
    .regex(/^[+0-9()\-.\s]+$/, 'Use digits, spaces, +, -, or parentheses'),
  customer_address: z
    .string()
    .trim()
    .max(500, 'Address is too long')
    .optional()
    .or(z.literal('')),
})

type CheckoutValues = z.infer<typeof schema>

export function Checkout() {
  const { user } = useAuth()
  const { store } = useStore()
  const { lines, subtotalCents, loading, refresh } = useCart()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: (user?.user_metadata?.full_name as string | undefined) ?? '',
      customer_phone: (user?.user_metadata?.phone as string | undefined) ?? '',
      customer_address: '',
    },
  })

  async function onSubmit(values: CheckoutValues) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { data, error } = await supabase.rpc('place_order', {
        p_store_id: store.id,
        p_customer_name: values.customer_name.trim(),
        p_customer_phone: values.customer_phone.trim(),
        p_customer_address: values.customer_address?.trim() || null,
      })

      if (error) throw error
      const orderId = typeof data === 'string' ? data : null
      if (!orderId) throw new Error('The order could not be created.')

      notifyOrdersChanged()
      void supabase.auth
        .updateUser({
          data: {
            full_name: values.customer_name.trim(),
            phone: values.customer_phone.trim(),
          },
        })
        .catch(() => {})
      toast.success('Order placed')
      navigate(storePath(store.slug, `/order/${orderId}`), { replace: true })
      void refresh()
    } catch (error) {
      const message = getErrorMessage(error)
      setSubmitError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!loading && lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Nothing to check out"
        description="Your cart is empty. Add items before placing an order."
        action={
          <Button asChild>
            <Link to={storePath(store.slug)}>
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
      <div>
        <Link
          to={storePath(store.slug, 'cart')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cart
        </Link>
        <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
          Checkout
        </h1>
        <p className="text-sm text-muted-foreground">
          Add your contact details so the shop can confirm your order.
        </p>
      </div>

      {submitError ? (
        <Alert variant="error" title="Order not placed">
          <p>{submitError}</p>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              id="checkout-form"
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customer_name">Full name</Label>
                <Input
                  id="customer_name"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  {...register('customer_name')}
                />
                {errors.customer_name ? (
                  <p className="text-sm text-destructive">
                    {errors.customer_name.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customer_phone">Phone number</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+966 50 123 4567"
                  {...register('customer_phone')}
                />
                {errors.customer_phone ? (
                  <p className="text-sm text-destructive">
                    {errors.customer_phone.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customer_address">
                  Delivery / pickup note{' '}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="customer_address"
                  autoComplete="street-address"
                  placeholder="Address or pickup preferences"
                  {...register('customer_address')}
                />
                {errors.customer_address ? (
                  <p className="text-sm text-destructive">
                    {errors.customer_address.message}
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-1 w-full"
                disabled={submitting}
              >
                {submitting ? <Spinner /> : <Lock />}
                {submitting
                  ? 'Placing order…'
                  : `Place order · ${formatMoney(subtotalCents)}`}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                No payment is taken online. The shop will contact you to confirm.
              </p>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col divide-y">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-medium">
                      {line.item?.name ?? 'Unavailable item'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qty {line.quantity}
                      {line.item
                        ? ` · ${formatMoney(line.item.price_cents)}`
                        : ''}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold">
                    {formatMoney(
                      (line.item?.price_cents ?? 0) * line.quantity,
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t pt-3 text-base font-bold">
              <span>Total</span>
              <span>{formatMoney(subtotalCents)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
