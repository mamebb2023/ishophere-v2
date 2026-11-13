import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  AuthContext,
  type AccessSnapshot,
} from '@/contexts/auth-context'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { StoreMembership } from '@/lib/types'

interface AccessState extends AccessSnapshot {
  userId: string | null
}

const EMPTY_ACCESS: AccessState = {
  userId: null,
  isDev: false,
  memberships: [],
}

const NO_MEMBERSHIPS: StoreMembership[] = []

async function loadAccess(userId: string): Promise<AccessSnapshot> {
  const [devResult, membershipResult] = await Promise.all([
    supabase.rpc('is_dev'),
    supabase
      .from('store_members')
      .select(
        'store_id, user_id, role, display_name, created_at, store:stores(*)',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
  ])

  return {
    isDev: !devResult.error && devResult.data === true,
    memberships: membershipResult.error
      ? []
      : ((membershipResult.data ?? []) as unknown as StoreMembership[]),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessState, setAccessState] = useState<AccessState>(EMPTY_ACCESS)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let active = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return
        setSession(data.session)
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return
        setSession(nextSession)
        setLoading(false)
      },
    )

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user?.id

  // Derived so a newly signed-in user is treated as "checking" immediately,
  // without a render that briefly looks like a non-admin.
  const accessLoading = Boolean(userId) && accessState.userId !== userId
  const accessIsCurrent = Boolean(userId) && accessState.userId === userId
  const isDev = accessIsCurrent && accessState.isDev
  const memberships = useMemo(
    () => (accessIsCurrent ? accessState.memberships : NO_MEMBERSHIPS),
    [accessIsCurrent, accessState.memberships],
  )
  const isAdmin = isDev || memberships.length > 0

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      setAccessState(EMPTY_ACCESS)
      return
    }

    let active = true

    void (async () => {
      try {
        const snapshot = await loadAccess(userId)
        if (active) setAccessState({ userId, ...snapshot })
      } catch {
        if (active) {
          setAccessState({ userId, isDev: false, memberships: [] })
        }
      }
    })()

    return () => {
      active = false
    }
  }, [userId])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    if (data.session) setSession(data.session)
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, redirectPath = '/') => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectPath}`,
        },
      })
      if (error) throw error
      if (data.session) setSession(data.session)
      return { needsConfirmation: !data.session }
    },
    [],
  )

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setSession(null)
    setAccessState(EMPTY_ACCESS)
  }, [])

  const refreshAccess = useCallback(async (): Promise<AccessSnapshot> => {
    if (!isSupabaseConfigured || !userId) {
      setAccessState(EMPTY_ACCESS)
      return { isDev: false, memberships: [] }
    }

    const snapshot = await loadAccess(userId)
    setAccessState({ userId, ...snapshot })
    return snapshot
  }, [userId])

  const canManageStore = useCallback(
    (storeId: string | null | undefined) => {
      if (!storeId) return false
      if (isDev) return true
      return memberships.some((membership) => membership.store_id === storeId)
    },
    [isDev, memberships],
  )

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isDev,
      isAdmin,
      accessLoading,
      memberships,
      signIn,
      signUp,
      signOut,
      refreshAccess,
      canManageStore,
    }),
    [
      session,
      loading,
      isDev,
      isAdmin,
      accessLoading,
      memberships,
      signIn,
      signUp,
      signOut,
      refreshAccess,
      canManageStore,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
