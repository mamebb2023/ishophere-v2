import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AccessDenied } from '@/components/layout/AccessDenied'
import { FullPageLoader } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'

export function RequireDev({ children }: { children: ReactNode }) {
  const { user, loading, accessLoading, isDev } = useAuth()
  const location = useLocation()

  if (loading || accessLoading) {
    return <FullPageLoader label="Checking platform access…" />
  }

  if (!user) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/admin/login?next=${encodeURIComponent(next)}`} replace />
  }

  if (!isDev) {
    return (
      <AccessDenied
        title="Platform owner access required"
        description={`${user.email} is signed in, but it does not have the global dev role.`}
        backTo="/admin"
        backLabel="Go to admin"
      />
    )
  }

  return <>{children}</>
}
