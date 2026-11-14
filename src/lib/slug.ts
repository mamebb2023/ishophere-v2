export const STORE_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const RESERVED_STORE_SLUGS = new Set([
  'admin',
  'auth',
  'dev',
  'stores',
  'account',
  'cart',
  'checkout',
  'order',
  'api',
  's',
  'static',
  'assets',
  'login',
  'signup',
  'new',
  'ishophere',
])

/** Returns an error message for an invalid store slug, or null when valid. */
export function validateStoreSlug(value: string): string | null {
  const slug = value.trim().toLowerCase()

  if (slug.length < 2) return 'Slug must be at least 2 characters'
  if (slug.length > 60) return 'Slug is too long'
  if (!STORE_SLUG_PATTERN.test(slug)) {
    return 'Use lowercase letters, numbers, and hyphens'
  }
  if (RESERVED_STORE_SLUGS.has(slug)) return 'That store slug is reserved'

  return null
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
