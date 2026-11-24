import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { PostgrestError, Session } from '@supabase/supabase-js'
import { AuthContext } from '@/contexts/auth-context'
import type {
  ProfileUpdate,
  SignInCredentials,
  SignUpParams,
} from '@/contexts/auth-context'
import { makeInternalEmail } from '@/lib/phone'
import { getSiteOrigin } from '@/lib/platform'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

interface AdminState {
  userId: string | null
  isAdmin: boolean
}

interface ProfileState {
  userId: string | null
  profile: Profile | null
}

interface SessionTokens {
  access_token: string
  refresh_token: string
}

interface AccountAuthResponse {
  session?: SessionTokens
  email?: string
}

const PROFILE_COLUMNS = 'id, name, email, phone'

function profileErrorMessage(error: PostgrestError): string {
  if (error.code === '42P01') {
    return 'Your profile is not available right now. Contact the shop.'
  }
  if (error.code === '23505') {
    return error.message.toLowerCase().includes('phone')
      ? 'That phone number is already linked to another account.'
      : 'That email is already linked to another account.'
  }
  if (error.code === '23514') {
    return 'Enter a valid name and phone number.'
  }
  if (error.code === '42501') {
    return 'Profile updates are not permitted right now. Contact the shop.'
  }
  return error.message
}

async function functionErrorMessage(error: unknown): Promise<string | null> {
  const context = (error as { context?: Response } | null)?.context
  if (!context || typeof context.json !== 'function') return null

  try {
    const payload = (await context.json()) as { error?: unknown }
    return typeof payload?.error === 'string' ? payload.error : null
  } catch {
    return null
  }
}

async function invokeAccountAuth(
  body: Record<string, unknown>,
): Promise<AccountAuthResponse> {
  const { data, error } = await supabase.functions.invoke('account-auth', { body })

  if (error) {
    const detail = await functionErrorMessage(error)
    if (detail) throw new Error(detail)

    const name = (error as { name?: string } | null)?.name
    if (name === 'FunctionsFetchError') {
      throw new Error(
        'Could not reach the shop sign-in service. Check your connection and try again.',
      )
    }
    if (name === 'FunctionsRelayError') {
      throw new Error(
        'Phone sign-in is temporarily unavailable. Try again in a moment.',
      )
    }

    const status = (error as { context?: Response } | null)?.context?.status
    if (status === 404) {
      throw new Error(
        'Phone sign-in is not available right now. Contact the shop.',
      )
    }
    throw error
  }

  if (data && typeof data === 'object' && typeof data.error === 'string') {
    throw new Error(data.error)
  }

  return (data ?? {}) as AccountAuthResponse
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminState, setAdminState] = useState<AdminState>({
    userId: null,
    isAdmin: false,
  })
  const [profileState, setProfileState] = useState<ProfileState>({
    userId: null,
    profile: null,
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

  const profileLoading = Boolean(userId) && profileState.userId !== userId
  const profile = profileState.userId === userId ? profileState.profile : null

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

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      setProfileState({ userId: null, profile: null })
      return
    }

    let active = true

    void (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', userId)
        .maybeSingle()

      if (!active) return
      setProfileState({
        userId,
        profile: error ? null : ((data as Profile | null) ?? null),
      })
    })()

    return () => {
      active = false
    }
  }, [userId])

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseConfigured || !userId) {
      setProfileState({ userId: null, profile: null })
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .maybeSingle()

    const next = error ? null : ((data as Profile | null) ?? null)
    setProfileState({ userId, profile: next })
    return next
  }, [userId])

  const applySession = useCallback(async (tokens?: SessionTokens) => {
    if (!tokens) throw new Error('Sign-in did not return a session. Try again.')
    const { data, error } = await supabase.auth.setSession(tokens)
    if (error) throw error
    if (data.session) setSession(data.session)
  }, [])

  const signIn = useCallback(
    async (credentials: SignInCredentials, password: string) => {
      if ('phone' in credentials) {
        const data = await invokeAccountAuth({
          action: 'login-phone',
          phone: credentials.phone,
          password,
        })
        await applySession(data.session)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password,
      })
      if (error) throw error
      if (data.session) setSession(data.session)
    },
    [applySession],
  )

  const signUp = useCallback(async (params: SignUpParams) => {
    const metadata = params.name ? { name: params.name } : undefined

    if ('phone' in params) {
      const { data: available, error: availabilityError } = await supabase.rpc(
        'is_phone_available',
        { p_phone: params.phone },
      )

      if (availabilityError) {
        throw new Error(
          'Phone sign-up is not available right now. Contact the shop.',
        )
      }
      if (available === false) {
        throw new Error('That phone number already has an account. Sign in instead.')
      }

      // Phone-only customers get an internal auth email so they can use
      // password auth without an SMS provider. It is never shown in the app.
      const { data: result, error } = await supabase.auth.signUp({
        email: makeInternalEmail(),
        password: params.password,
        options: {
          data: { ...metadata, phone: params.phone, internal_email: true },
        },
      })

      if (error) {
        if (/database error/i.test(error.message)) {
          throw new Error(
            'That phone number may already have an account. Try signing in instead.',
          )
        }
        throw error
      }

      if (result.session) setSession(result.session)
      return { needsConfirmation: !result.session }
    }

    const { data: result, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: metadata,
        emailRedirectTo: `${getSiteOrigin()}${params.redirectPath ?? '/'}`,
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
    setProfileState({ userId: null, profile: null })
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

  const updateProfile = useCallback(
    async (update: ProfileUpdate) => {
      if (!userId) throw new Error('Sign in again to update your details.')

      const patch: Record<string, string | null> = {}
      if (update.name !== undefined) patch.name = update.name?.trim() || null
      if (update.phone !== undefined) patch.phone = update.phone?.trim() || null
      if (Object.keys(patch).length === 0) return

      // Use update-then-insert instead of upsert: PostgREST upserts need
      // table-level INSERT/UPDATE, while profiles only grants the name/phone
      // columns so customers can never change their email directly.
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', userId)
        .select(PROFILE_COLUMNS)
        .maybeSingle()

      if (updateError) throw new Error(profileErrorMessage(updateError))

      let profileRow = updated as Profile | null

      if (!profileRow) {
        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, ...patch })
          .select(PROFILE_COLUMNS)
          .maybeSingle()

        if (insertError) {
          // Another tab may have created the row between the two requests.
          if (insertError.code === '23505' && insertError.message.includes('pkey')) {
            const { data: retried, error: retryError } = await supabase
              .from('profiles')
              .update(patch)
              .eq('id', userId)
              .select(PROFILE_COLUMNS)
              .maybeSingle()
            if (retryError) throw new Error(profileErrorMessage(retryError))
            profileRow = retried as Profile | null
          } else {
            throw new Error(profileErrorMessage(insertError))
          }
        } else {
          profileRow = inserted as Profile | null
        }
      }

      if (!profileRow) throw new Error('Your profile could not be updated. Try again.')

      setProfileState({ userId, profile: profileRow })

      // Keep auth metadata in sync so name/phone survive a profile read failure.
      const metadata: Record<string, string | null> = {}
      if ('name' in patch) metadata.name = patch.name
      if ('phone' in patch) metadata.phone = patch.phone

      if (Object.keys(metadata).length > 0) {
        try {
          await supabase.auth.updateUser({ data: metadata })
        } catch {
          // The profile is already saved; metadata is only a fallback.
        }
      }
    },
    [userId],
  )

  const addEmail = useCallback(
    async (email: string, password: string) => {
      const data = await invokeAccountAuth({
        action: 'set-email',
        email,
        password,
      })
      await applySession(data.session)
      await refreshProfile()
    },
    [applySession, refreshProfile],
  )

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const data = await invokeAccountAuth({
        action: 'change-password',
        currentPassword,
        newPassword,
      })
      await applySession(data.session)
    },
    [applySession],
  )

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileLoading,
      loading,
      isAdmin,
      adminLoading,
      signIn,
      signUp,
      signOut,
      refreshAdmin,
      refreshProfile,
      updateProfile,
      addEmail,
      changePassword,
    }),
    [
      session,
      profile,
      profileLoading,
      loading,
      isAdmin,
      adminLoading,
      signIn,
      signUp,
      signOut,
      refreshAdmin,
      refreshProfile,
      updateProfile,
      addEmail,
      changePassword,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
