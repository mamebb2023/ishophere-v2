import { Capacitor } from '@capacitor/core'

/** Canonical public site, used when the WebView origin is local. */
export const PRODUCTION_SITE_URL = 'https://tofik.store'

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * Public site origin for links that leave the app (auth redirects, canonical
 * URLs). Inside the native app the WebView origin is https://localhost, so
 * always use the real store domain there.
 */
export function getSiteOrigin(): string {
  if (isNativeApp()) return PRODUCTION_SITE_URL
  if (typeof window !== 'undefined') return window.location.origin
  return PRODUCTION_SITE_URL
}
