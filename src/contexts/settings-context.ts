import { createContext } from 'react'
import type { ShopSettings } from '@/lib/types'

export interface SettingsContextValue {
  settings: ShopSettings
  loading: boolean
  saveSettings: (values: Pick<ShopSettings, 'shop_name' | 'primary_color' | 'secondary_color' | 'accent_color'>) => Promise<void>
  refreshSettings: () => Promise<void>
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)
