import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Lock, Mail, ShieldAlert, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FullPageLoader, Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/format'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  emailPasswordSchema,
  type EmailPasswordValues,
} from '@/lib/validation'

export function AdminLogin() {
  const { user, isAdmin, accessLoading, signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [submitting, setSubmitting] = useState(false)

  const rawNext = searchParams.get('next')
  const next =
    rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')
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

  async function onSubmit(values: EmailPasswordValues) {
    setSubmitting(true)
    try {
      await signIn(values.email, values.password)
      navigate(next, { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
      reset()
      toast.success('Signed out')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  if (user && accessLoading) {
    return <FullPageLoader label="Checking your access…" />
  }

  if (user && isAdmin) {
    return <Navigate to={next} replace />
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-y-auto bg-muted/30 px-4 py-8 sm:py-12">
      <div className="m-auto w-full max-w-md">
        <div className="mb-5 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-black tracking-tight">Store admin login</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with the email address linked to your store account.
          </p>
        </div>

        {user ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <ShieldAlert className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-bold">No store access</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {user.email} is signed in, but this account is not an owner or
                  staff member of any store.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                <Button onClick={() => void handleSignOut()}>
                  Sign in with another account
                </Button>
                <Button asChild variant="outline">
                  <Link to="/stores">Browse stores</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5 sm:p-6">
              {!isSupabaseConfigured ? (
                <Alert
                  variant="info"
                  title="Supabase is not configured"
                  className="mb-4"
                >
                  Add your project URL and anon key to .env.local before signing
                  in.
                </Alert>
              ) : null}

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
                      inputMode="email"
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
                      autoComplete="current-password"
                      placeholder="Your password"
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
                  Sign in
                  {!submitting ? <ArrowRight /> : null}
                </Button>
              </form>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Need an account?{' '}
                <Link
                  to="/auth"
                  className="font-medium text-primary hover:underline"
                >
                  Sign up
                </Link>
                , then ask the platform owner to create a store for you.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="mt-4 text-center">
          <Link
            to="/stores"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to stores
          </Link>
        </div>
      </div>
    </div>
  )
}
