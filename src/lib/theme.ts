import { DEFAULT_STORE_COLORS, type Store } from '@/lib/types'

export function applyStoreTheme(
  store: Pick<Store, 'name' | 'primary_color' | 'secondary_color' | 'accent_color'>,
) {
  const root = document.documentElement
  root.style.setProperty('--brand', store.primary_color)
  root.style.setProperty('--brand-2', store.secondary_color)
  root.style.setProperty('--brand-accent', store.accent_color)
  document.title = store.name
}

export function resetStoreTheme() {
  const root = document.documentElement
  root.style.setProperty('--brand', DEFAULT_STORE_COLORS.primary_color)
  root.style.setProperty('--brand-2', DEFAULT_STORE_COLORS.secondary_color)
  root.style.setProperty('--brand-accent', DEFAULT_STORE_COLORS.accent_color)
  document.title = 'iShopHere'
}
