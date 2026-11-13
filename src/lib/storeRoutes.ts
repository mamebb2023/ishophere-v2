export { DEFAULT_STORE_SLUG } from '@/lib/types'

function joinPath(base: string, suffix: string): string {
  if (!suffix) return base
  return `${base}/${suffix.replace(/^\/+/, '')}`
}

/** Public storefront path, e.g. storePath('demo', '/cart'). */
export function storePath(storeSlug: string, suffix = ''): string {
  return joinPath(`/s/${encodeURIComponent(storeSlug)}`, suffix)
}

/** Store admin path, e.g. storeAdminPath('demo', 'orders'). */
export function storeAdminPath(storeSlug: string, suffix = ''): string {
  return joinPath(`/s/${encodeURIComponent(storeSlug)}/admin`, suffix)
}
