import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import type {
  FieldErrors,
  Resolver,
  ResolverResult,
} from 'react-hook-form'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { getErrorMessage } from '@/lib/format'
import { takePendingCartAction } from '@/lib/pendingCart'
import {
  phoneSignInSchema,
  phoneSignUpSchema,
  signInSchema,
  signUpSchema,
} from '@/lib/validation'

type Mode = 'signin' | 'signup'
type Identifier = 'phone' | 'email'

interface AuthValues {
  name?: string
  phone?: string
  email?: string
  password: string
  confirmPassword?: string
}

const EMPTY_VALUES: AuthValues = {
  name: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function PasswordVisibilityToggle({
  visible,
  onToggle,
  label,
}: {
  visible: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
      aria-pressed={visible}
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )
}

export function AuthPage() {
  const { user, signIn, signUp } = useAuth()
  const { add } = useCart()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<Mode>('signin')
  const [identifier, setIdentifier] = useState<Identifier>('phone')
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const completedRef = useRef(false)

  const rawNext = searchParams.get('next')
  const next =
    rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  const resolver = useCallback<Resolver<AuthValues>>(
    async (values): Promise<ResolverResult<AuthValues, AuthValues>> => {
      const schema =
        mode === 'signup'
          ? identifier === 'phone'
            ? phoneSignUpSchema
            : signUpSchema
          : identifier === 'phone'
            ? phoneSignInSchema
            : signInSchema

      const result = schema.safeParse(values)
      if (result.success) {
        return { values: result.data as AuthValues, errors: {} }
      }

      const errors: Record<string, { type: string; message: string }> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !errors[field]) {
          errors[field] = { type: issue.code, message: issue.message }
        }
      }

      return {
        values: {},
        errors: errors as FieldErrors<AuthValues>,
      }
    },
    [mode, identifier],
  )

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuthValues>({
    resolver,
    defaultValues: EMPTY_VALUES,
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
        if (identifier === 'phone') {
          await signIn({ phone: values.phone ?? '' }, values.password)
        } else {
          await signIn({ email: values.email?.trim() ?? '' }, values.password)
        }
        return
      }

      const name = values.name?.trim() ?? ''

      if (identifier === 'phone') {
        const { needsConfirmation } = await signUp({
          name,
          phone: values.phone ?? '',
          password: values.password,
          redirectPath: '/auth',
        })
        if (needsConfirmation) {
          toast.error(
            'Account created, but it is not ready to sign in yet. Contact the shop.',
            { duration: 8000 },
          )
        }
        return
      }

      const { needsConfirmation } = await signUp({
        name,
        email: values.email?.trim() ?? '',
        password: values.password,
        redirectPath: '/auth',
      })
      if (needsConfirmation) {
        setConfirmationSent(true)
        reset(EMPTY_VALUES)
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
    setShowPassword(false)
    setShowConfirmPassword(false)
    reset(EMPTY_VALUES)
  }

  function switchIdentifier(nextIdentifier: Identifier) {
    setIdentifier(nextIdentifier)
    setConfirmationSent(false)
    setShowPassword(false)
    setShowConfirmPassword(false)
    reset(EMPTY_VALUES)
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 py-4 sm:py-10">
      <div className="text-center">
        <img
          src="/logo.png"
          alt=""
          className="mx-auto mb-3 h-12 w-12 rounded-sm object-cover shadow-sm"
        />
        <h1 className="text-2xl font-black tracking-tight">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === 'signin'
            ? 'Sign in with your phone or email to add items and check out.'
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
              Login
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
              Create Account
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border bg-muted/40 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              {mode === 'signin' ? 'Sign in with' : 'Sign up with'}
            </span>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-0.5">
              <button
                type="button"
                aria-pressed={identifier === 'phone'}
                onClick={() => switchIdentifier('phone')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  identifier === 'phone'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Phone className="h-3.5 w-3.5" />
                Phone
              </button>
              <button
                type="button"
                aria-pressed={identifier === 'email'}
                onClick={() => switchIdentifier('email')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  identifier === 'email'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </button>
            </div>
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
              {mode === 'signup' ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
                      className="pl-9"
                      {...register('name')}
                    />
                  </div>
                  {errors.name ? (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  ) : null}
                </div>
              ) : null}

              {identifier === 'phone' ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <PhoneInput
                        id="phone"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        invalid={Boolean(errors.phone)}
                        aria-describedby={
                          errors.phone ? 'phone-error' : undefined
                        }
                      />
                    )}
                  />
                  {errors.phone ? (
                    <p id="phone-error" className="text-sm text-destructive">
                      {errors.phone.message}
                    </p>
                  ) : null}
                </div>
              ) : (
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
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={
                      mode === 'signin' ? 'current-password' : 'new-password'
                    }
                    placeholder="At least 6 characters"
                    className="pl-9 pr-11"
                    {...register('password')}
                  />
                  <PasswordVisibilityToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword((value) => !value)}
                    label="password"
                  />
                </div>
                {errors.password ? (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              {mode === 'signup' ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      className="pl-9 pr-11"
                      {...register('confirmPassword')}
                    />
                    <PasswordVisibilityToggle
                      visible={showConfirmPassword}
                      onToggle={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      label="confirm password"
                    />
                  </div>
                  {errors.confirmPassword ? (
                    <p className="text-sm text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

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
