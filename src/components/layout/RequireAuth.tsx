import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { FullPageLoader } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader label="Checking your session…" />

  if (!user) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/auth?next=${encodeURIComponent(next)}`} replace />
  }

  return <>{children}</>
}
