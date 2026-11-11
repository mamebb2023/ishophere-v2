import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Lock, Mail, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { getErrorMessage } from '@/lib/format'
import { takePendingCartAction } from '@/lib/pendingCart'
import {
  emailPasswordSchema as schema,
  type EmailPasswordValues as AuthValues,
} from '@/lib/validation'

type Mode = 'signin' | 'signup'

export function AuthPage() {
  const { user, signIn, signUp } = useAuth()
  const { add } = useCart()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<Mode>('signin')
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const completedRef = useRef(false)

  const rawNext = searchParams.get('next')
  const next =
    rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuthValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (!user || completedRef.current) return
    completedRef.current = true

    void (async () => {
      const pending = takePendingCartAction()
      if (pending) {
        try {
          await add(pending.itemId, pending.quantity)
          toast.success('Your cart is ready')
        } catch (error) {
          toast.error(getErrorMessage(error))
        }
      }
      navigate(next, { replace: true })
    })()
  }, [user, add, navigate, next])

  async function onSubmit(values: AuthValues) {
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signIn(values.email, values.password)
      } else {
        const { needsConfirmation } = await signUp(
          values.email,
          values.password,
          '/auth',
        )
        if (needsConfirmation) {
          setConfirmationSent(true)
          reset()
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode)
    setConfirmationSent(false)
    reset()
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 py-4 sm:py-10">
      <div className="text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <ShoppingBag className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-black tracking-tight">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === 'signin'
            ? 'Sign in to add items to your cart and check out.'
            : 'A free account keeps your cart saved across devices.'}
        </p>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                mode === 'signin'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                mode === 'signup'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign up
            </button>
          </div>

          {confirmationSent ? (
            <Alert variant="success" title="Check your email">
              We sent a confirmation link to your inbox. Confirm your email, then
              sign in here.
            </Alert>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    {...register('email')}
                  />
                </div>
                {errors.email ? (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete={
                      mode === 'signin' ? 'current-password' : 'new-password'
                    }
                    placeholder="At least 6 characters"
                    className="pl-9"
                    {...register('password')}
                  />
                </div>
                {errors.password ? (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? <Spinner /> : null}
                {mode === 'signin' ? 'Sign in' : 'Create account'}
                {!submitting ? <ArrowRight /> : null}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <Link to="/" className="font-medium text-primary hover:underline">
          Continue browsing
        </Link>
        <span className="mx-2">·</span>
        <Link
          to="/admin/login"
          className="font-medium text-primary hover:underline"
        >
          Shop owner login
        </Link>
      </div>
    </div>
  )
}
