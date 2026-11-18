import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type SignInCredentials = { email: string } | { phone: string }

export type SignUpParams = {
  password: string
  name?: string
  redirectPath?: string
} & ({ email: string } | { phone: string })

export interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  isAdmin: boolean
  adminLoading: boolean
  signIn: (credentials: SignInCredentials, password: string) => Promise<void>
  signUp: (params: SignUpParams) => Promise<{ needsConfirmation: boolean }>
  signOut: () => Promise<void>
  refreshAdmin: () => Promise<boolean>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
