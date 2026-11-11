import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FullPageLoader, Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/format'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  emailPasswordSchema,
  type EmailPasswordValues,
} from '@/lib/validation'

type Mode = 'signin' | 'signup'

export function AdminLogin() {
  const {
    user,
    isAdmin,
    signIn,
    signUp,
    signOut,
    refreshAdmin,
  } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<Mode>('signin')
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [notAdmin, setNotAdmin] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const attemptedForRef = useRef<string | null>(null)

  const rawNext = searchParams.get('next')
  const next =
    rawNext && rawNext.startsWith('/admin') && !rawNext.startsWith('//')
      ? rawNext
      : '/admin'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailPasswordValues>({
    resolver: zodResolver(emailPasswordSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return
    if (attemptedForRef.current === user.id) return

    attemptedForRef.current = user.id
    setChecking(true)
    setNotAdmin(false)

    void (async () => {
      const { data, error } = await supabase.rpc('claim_admin')
      if (error) {
        setChecking(false)
        setNotAdmin(true)
        return
      }

      if (data === true) {
        await refreshAdmin()
        navigate(next, { replace: true })
      } else {
        setChecking(false)
        setNotAdmin(true)
      }
    })()
  }, [user, navigate, next, refreshAdmin])

  async function onSubmit(values: EmailPasswordValues) {
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signIn(values.email, values.password)
      } else {
        const { needsConfirmation } = await signUp(
          values.email,
          values.password,
          '/admin/login',
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

  async function handleSignOut() {
    try {
      await signOut()
      attemptedForRef.current = null
      setNotAdmin(false)
      setChecking(false)
      setConfirmationSent(false)
      setMode('signin')
      reset()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  if (user && isAdmin && !checking) {
    return <Navigate to={next} replace />
  }

  if (checking) {
    return <FullPageLoader label="Checking owner access…" />
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-y-auto bg-muted/30 px-4 py-8 sm:py-12">
      <div className="m-auto w-full max-w-md">
        <div className="mb-5 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-black tracking-tight">Shop owner login</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage items, orders, categories, and the shop theme.
          </p>
        </div>

        {notAdmin && user ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <ShieldAlert className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-bold">Not an admin</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {user.email} is signed in, but this account does not have owner
                  access.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                <Button onClick={() => void handleSignOut()}>
                  Sign out and use another account
                </Button>
                <Button asChild variant="outline">
                  <Link to="/">Back to shop</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5 sm:p-6">
              {!isSupabaseConfigured ? (
                <Alert variant="info" title="Supabase is not configured">
                  Add your project URL and anon key to .env.local before signing
                  in.
                </Alert>
              ) : null}

              <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setConfirmationSent(false)
                    reset()
                  }}
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
                  onClick={() => {
                    setMode('signup')
                    setConfirmationSent(false)
                    reset()
                  }}
                  className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                    mode === 'signup'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Create owner
                </button>
              </div>

              {confirmationSent ? (
                <Alert variant="success" title="Check your email">
                  Confirm the new account, then return here to sign in.
                </Alert>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="admin-email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="admin-email"
                        type="email"
                        autoComplete="email"
                        placeholder="owner@example.com"
                        className="pl-9"
                        {...register('email')}
                      />
                    </div>
                    {errors.email ? (
                      <p className="text-sm text-destructive">
                        {errors.email.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="admin-password"
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
                    {mode === 'signin' ? 'Sign in' : 'Create owner account'}
                    {!submitting ? <ArrowRight /> : null}
                  </Button>
                </form>
              )}

              <p className="mt-4 text-center text-xs text-muted-foreground">
                The first account to claim ownership becomes the shop owner.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to shop
          </Link>
        </div>
      </div>
    </div>
  )
}
