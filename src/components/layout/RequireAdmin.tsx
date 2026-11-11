import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FullPageLoader } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin, adminLoading } = useAuth()
  const location = useLocation()

  if (loading || (user && adminLoading)) {
    return <FullPageLoader label="Checking admin access…" />
  }

  if (!user) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/admin/login?next=${encodeURIComponent(next)}`} replace />
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-dvh flex-col overflow-y-auto bg-muted/40 px-4 py-10">
        <div className="m-auto w-full max-w-md">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <ShieldAlert className="h-7 w-7" />
              </span>
              <div>
                <h1 className="text-xl font-bold">Admin access required</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  You are signed in as {user.email}, but this account is not an
                  admin.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                <Button asChild>
                  <Link to="/">Back to shop</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin/login">Use another account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
