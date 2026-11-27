import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Lock,
  Pencil,
  Phone,
  ShoppingBag,
  ShoppingCart,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useSeo } from '@/hooks/useSeo'
import { notifyOrdersChanged } from '@/lib/events'
import { getErrorMessage } from '@/lib/format'
import { successFeedback } from '@/lib/native'
import { formatMoney } from '@/lib/money'
import { formatPhoneNumber } from '@/lib/phone'
import { supabase } from '@/lib/supabase'
import { getUserName, getUserPhone } from '@/lib/user'
import { nameField, phoneField } from '@/lib/validation'

const schema = z.object({
  customer_name: nameField,
  customer_phone: phoneField,
  customer_address: z
    .string()
    .trim()
    .max(500, 'Address is too long')
    .optional()
    .or(z.literal('')),
})

type CheckoutValues = z.infer<typeof schema>

export function Checkout() {
  const { user, profile, profileLoading, updateProfile } = useAuth()
  const { lines, subtotalCents, loading, refresh } = useCart()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [editingContact, setEditingContact] = useState(false)

  useSeo({
    title: 'Checkout',
    description:
      'Confirm your contact and delivery details, then place your Tofik Store order.',
    path: '/checkout',
    noIndex: true,
  })

  const accountName = getUserName(user, profile)
  const accountPhone = getUserPhone(user, profile)
  const hasSavedContact = Boolean(accountName && accountPhone)
  const showContactFields = !hasSavedContact || editingContact

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      customer_address: '',
    },
  })

  // Fill checkout from the account as soon as the profile is available.
  useEffect(() => {
    if (profileLoading) return

    if (!getValues('customer_name') && accountName) {
      setValue('customer_name', accountName, { shouldValidate: false })
    }
    if (!getValues('customer_phone') && accountPhone) {
      setValue('customer_phone', accountPhone, { shouldValidate: false })
    }
  }, [profileLoading, accountName, accountPhone, getValues, setValue])

  async function onSubmit(values: CheckoutValues) {
    setSubmitting(true)
    setSubmitError(null)

    const customerName = values.customer_name.trim()
    const customerPhone = values.customer_phone.trim()

    try {
      const { data, error } = await supabase.rpc('place_order', {
        p_customer_name: customerName,
        p_customer_phone: customerPhone,
        p_customer_address: values.customer_address?.trim() || null,
      })

      if (error) throw error
      const orderId = typeof data === 'string' ? data : null
      if (!orderId) throw new Error('The order could not be created.')

      notifyOrdersChanged()

      if (customerName !== accountName || customerPhone !== accountPhone) {
        void updateProfile({ name: customerName, phone: customerPhone }).catch(
          (error: unknown) => {
            toast.error(
              `Order placed, but your account details could not be saved: ${getErrorMessage(error)}`,
            )
          },
        )
      }

      await refresh()
      void successFeedback()
      toast.success('Order placed')
      navigate(`/order/${orderId}`, { replace: true })
    } catch (error) {
      const message = getErrorMessage(error)
      setSubmitError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function cancelContactEdit() {
    setEditingContact(false)
    setValue('customer_name', accountName)
    setValue('customer_phone', accountPhone)
  }

  if (!loading && lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Nothing to check out"
        description="Your cart is empty. Add items before placing an order."
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
      <div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cart
        </Link>
        <div className="mt-3 flex items-center gap-2 p-2 sm:p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShoppingCart className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Checkout
          </h1>
        </div>
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
            {profileLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <form
                id="checkout-form"
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                {showContactFields ? (
                  <>
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
                      <Controller
                        control={control}
                        name="customer_phone"
                        render={({ field }) => (
                          <PhoneInput
                            id="customer_phone"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            invalid={Boolean(errors.customer_phone)}
                            aria-describedby={
                              errors.customer_phone
                                ? 'customer-phone-error'
                                : undefined
                            }
                          />
                        )}
                      />
                      {errors.customer_phone ? (
                        <p
                          id="customer-phone-error"
                          className="text-sm text-destructive"
                        >
                          {errors.customer_phone.message}
                        </p>
                      ) : null}
                    </div>

                    <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      We save these details to your account so next checkout is
                      quicker.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border bg-muted/30 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Name
                            </p>
                            <p className="truncate text-sm font-semibold">
                              {accountName}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingContact(true)}
                        >
                          <Pencil />
                          Edit
                        </Button>
                      </div>
                      <div className="mt-3 flex min-w-0 items-start gap-3 border-t pt-3">
                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Phone
                          </p>
                          <p className="truncate text-sm font-semibold">
                            {formatPhoneNumber(accountPhone)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Using the contact details saved in your account.
                    </p>
                  </>
                )}

                {editingContact && hasSavedContact ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={cancelContactEdit}
                  >
                    Cancel changes
                  </Button>
                ) : null}

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
            )}
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
