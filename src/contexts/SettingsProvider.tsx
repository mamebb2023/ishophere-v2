import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  SettingsContext,
  type SettingsContextValue,
} from '@/contexts/settings-context'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { DEFAULT_SETTINGS, type ShopSettings } from '@/lib/types'

function applyTheme(settings: ShopSettings) {
  const root = document.documentElement
  root.style.setProperty('--brand', settings.primary_color)
  root.style.setProperty('--brand-2', settings.secondary_color)
  root.style.setProperty('--brand-accent', settings.accent_color)
  document.title = settings.shop_name
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const refreshSettings = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    if (!error && data) {
      setSettings(data as ShopSettings)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refreshSettings()
  }, [refreshSettings])

  useEffect(() => {
    applyTheme(settings)
  }, [settings])

  const saveSettings = useCallback<SettingsContextValue['saveSettings']>(
    async (values) => {
      const { data, error } = await supabase
        .from('settings')
        .update(values)
        .eq('id', 1)
        .select('*')
        .single()

      if (error) throw error
      if (data) setSettings(data as ShopSettings)
    },
    [],
  )

  const value = useMemo(
    () => ({ settings, loading, saveSettings, refreshSettings }),
    [settings, loading, saveSettings, refreshSettings],
  )

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  )
}
