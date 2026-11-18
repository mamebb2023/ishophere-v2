import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

export type SignInCredentials = { email: string } | { phone: string }

export type SignUpParams = {
  password: string
  name?: string
  redirectPath?: string
} & ({ email: string } | { phone: string })

export type ProfileUpdate = {
  name?: string | null
  phone?: string | null
}

export interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  profileLoading: boolean
  loading: boolean
  isAdmin: boolean
  adminLoading: boolean
  signIn: (credentials: SignInCredentials, password: string) => Promise<void>
  signUp: (params: SignUpParams) => Promise<{ needsConfirmation: boolean }>
  signOut: () => Promise<void>
  refreshAdmin: () => Promise<boolean>
  refreshProfile: () => Promise<Profile | null>
  updateProfile: (update: ProfileUpdate) => Promise<void>
  addEmail: (email: string, password: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
