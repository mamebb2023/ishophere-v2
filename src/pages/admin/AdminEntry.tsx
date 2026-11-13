import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, LayoutDashboard, LogOut, ShieldCheck, Store } from 'lucide-react'
import { toast } from 'sonner'
import { AccessDenied } from '@/components/layout/AccessDenied'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FullPageLoader } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/format'
import { storeAdminPath } from '@/lib/storeRoutes'

export function AdminEntry() {
  const { user, loading, accessLoading, isDev, memberships, signOut } = useAuth()
  const navigate = useNavigate()

  if (loading || (user && accessLoading)) {
    return <FullPageLoader label="Checking your access…" />
  }

  if (!user) {
    return <Navigate to="/admin/login?next=/admin" replace />
  }

  if (isDev) {
    return <Navigate to="/dev" replace />
  }

  if (memberships.length === 1) {
    const slug = memberships[0].store?.slug
    if (slug) return <Navigate to={storeAdminPath(slug)} replace />
  }

  if (memberships.length === 0) {
    return (
      <AccessDenied
        title="No store access"
        description={`${user.email} is signed in, but it is not a member of any store.`}
        backTo="/stores"
        backLabel="Browse stores"
      />
    )
  }

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Signed out')
      navigate('/admin/login')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-y-auto bg-muted/30 px-4 py-8 sm:py-12">
      <div className="m-auto w-full max-w-xl">
        <div className="mb-5 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <LayoutDashboard className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-black tracking-tight">Choose a store</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.email} manages more than one store.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-2 p-4 sm:p-5">
            {memberships.map((membership) => {
              const store = membership.store
              if (!store) return null
              return (
                <Button
                  key={membership.store_id}
                  asChild
                  variant="outline"
                  className="h-auto justify-start px-4 py-3"
                >
                  <Link to={storeAdminPath(store.slug)}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                      <Store className="h-5 w-5" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col items-start text-left">
                      <span className="truncate text-sm font-semibold">
                        {store.name}
                      </span>
                      <span className="truncate text-xs font-normal text-muted-foreground">
                        /s/{store.slug} · {membership.role}
                      </span>
                    </span>
                    <ArrowRight className="shrink-0 text-muted-foreground" />
                  </Link>
                </Button>
              )
            })}

            {isDev ? (
              <Button asChild variant="outline" className="justify-start">
                <Link to="/dev">
                  <ShieldCheck />
                  Dev console
                </Link>
              </Button>
            ) : null}

            <Button
              variant="ghost"
              className="justify-start text-muted-foreground"
              onClick={() => void handleSignOut()}
            >
              <LogOut />
              Sign out
            </Button>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link
            to="/stores"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Back to stores
          </Link>
        </div>
      </div>
    </div>
  )
}
