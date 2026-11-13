import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { StoreMembership } from '@/lib/types'

export interface AccessSnapshot {
  isDev: boolean
  memberships: StoreMembership[]
}

export interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  isDev: boolean
  isAdmin: boolean
  accessLoading: boolean
  memberships: StoreMembership[]
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    redirectPath?: string,
  ) => Promise<{ needsConfirmation: boolean }>
  signOut: () => Promise<void>
  refreshAccess: () => Promise<AccessSnapshot>
  canManageStore: (storeId: string | null | undefined) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
