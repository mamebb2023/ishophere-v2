import { createContext } from 'react'
import type { Store } from '@/lib/types'

export type StoreSettingsValues = Pick<
  Store,
  'name' | 'description' | 'primary_color' | 'secondary_color' | 'accent_color'
>

export interface StoreContextValue {
  store: Store
  loading: boolean
  error: string | null
  refreshStore: () => Promise<Store | null>
  saveStore: (values: StoreSettingsValues) => Promise<void>
}

export const StoreContext = createContext<StoreContextValue | null>(null)
