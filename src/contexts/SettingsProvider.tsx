import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  SettingsContext,
  type SettingsContextValue,
} from '@/contexts/settings-context'
import { normalizeHex, readableForeground } from '@/lib/color'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { DEFAULT_SETTINGS, type ShopSettings } from '@/lib/types'

function applyTheme(settings: ShopSettings) {
  const root = document.documentElement
  const primary =
    normalizeHex(settings.primary_color) ?? DEFAULT_SETTINGS.primary_color
  const secondary =
    normalizeHex(settings.secondary_color) ?? DEFAULT_SETTINGS.secondary_color
  const accent =
    normalizeHex(settings.accent_color) ?? DEFAULT_SETTINGS.accent_color

  root.style.setProperty('--brand', primary)
  root.style.setProperty('--brand-2', secondary)
  root.style.setProperty('--brand-accent', accent)
  root.style.setProperty('--primary-foreground', readableForeground(primary))
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
