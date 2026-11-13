import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AccessDenied } from '@/components/layout/AccessDenied'
import { FullPageLoader } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/hooks/useStore'

export function RequireStoreAdmin({ children }: { children: ReactNode }) {
  const { user, loading, accessLoading, canManageStore } = useAuth()
  const { store } = useStore()
  const location = useLocation()

  if (loading || accessLoading) {
    return <FullPageLoader label="Checking store access…" />
  }

  if (!user) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/admin/login?next=${encodeURIComponent(next)}`} replace />
  }

  if (!canManageStore(store.id)) {
    return (
      <AccessDenied
        title="Store access required"
        description={`You are signed in as ${user.email}, but this account is not a member of ${store.name}.`}
        backTo={`/s/${store.slug}`}
        backLabel="Back to store"
      />
    )
  }

  return <>{children}</>
}
