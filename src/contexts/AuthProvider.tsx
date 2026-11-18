import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthContext } from '@/contexts/auth-context'
import type {
  SignInCredentials,
  SignUpParams,
} from '@/contexts/auth-context'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface AdminState {
  userId: string | null
  isAdmin: boolean
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminState, setAdminState] = useState<AdminState>({
    userId: null,
    isAdmin: false,
  })

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
  const adminLoading = Boolean(userId) && adminState.userId !== userId
  const isAdmin =
    Boolean(userId) && adminState.userId === userId && adminState.isAdmin

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      setAdminState({ userId: null, isAdmin: false })
      return
    }

    let active = true

    void (async () => {
      try {
        const { data, error } = await supabase.rpc('is_admin')
        if (!active) return
        const value = !error && data === true
        // Never downgrade a freshly claimed admin if this automatic check
        // raced ahead of claim_admin(); manual refreshAdmin() is exact.
        setAdminState((current) =>
          current.userId === userId && current.isAdmin && !value
            ? current
            : { userId, isAdmin: value },
        )
      } catch {
        if (active) {
          setAdminState((current) =>
            current.userId === userId && current.isAdmin
              ? current
              : { userId, isAdmin: false },
          )
        }
      }
    })()

    return () => {
      active = false
    }
  }, [userId])

  const signIn = useCallback(
    async (credentials: SignInCredentials, password: string) => {
      const { data, error } =
        'phone' in credentials
          ? await supabase.auth.signInWithPassword({
              phone: credentials.phone,
              password,
            })
          : await supabase.auth.signInWithPassword({
              email: credentials.email,
              password,
            })
      if (error) throw error
      if (data.session) setSession(data.session)
    },
    [],
  )

  const signUp = useCallback(async (params: SignUpParams) => {
    const data = params.name ? { name: params.name } : undefined

    if ('phone' in params) {
      const { data: result, error } = await supabase.auth.signUp({
        phone: params.phone,
        password: params.password,
        options: { data },
      })
      if (error) throw error
      if (result.session) setSession(result.session)
      return { needsConfirmation: !result.session }
    }

    const { data: result, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data,
        emailRedirectTo: `${window.location.origin}${params.redirectPath ?? '/'}`,
      },
    })
    if (error) throw error
    if (result.session) setSession(result.session)
    return { needsConfirmation: !result.session }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setSession(null)
    setAdminState({ userId: null, isAdmin: false })
  }, [])

  const refreshAdmin = useCallback(async () => {
    if (!isSupabaseConfigured || !userId) {
      setAdminState({ userId: null, isAdmin: false })
      return false
    }
    const { data, error } = await supabase.rpc('is_admin')
    const value = !error && data === true
    setAdminState({ userId, isAdmin: value })
    return value
  }, [userId])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isAdmin,
      adminLoading,
      signIn,
      signUp,
      signOut,
      refreshAdmin,
    }),
    [session, loading, isAdmin, adminLoading, signIn, signUp, signOut, refreshAdmin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
