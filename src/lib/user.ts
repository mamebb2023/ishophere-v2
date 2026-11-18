import type { User } from '@supabase/supabase-js'

function metadataString(user: User | null, key: string): string {
  const value = user?.user_metadata?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

// `name` is the canonical metadata key. Older accounts stored `full_name`.
export function getUserName(user: User | null): string {
  return metadataString(user, 'name') || metadataString(user, 'full_name')
}

export function getUserPhone(user: User | null): string {
  return user?.phone?.trim() || metadataString(user, 'phone')
}

export function getUserIdentifier(user: User | null): string {
  return getUserPhone(user) || user?.email || ''
}

export function getUserDisplayName(user: User | null): string {
  return getUserName(user) || getUserIdentifier(user) || 'Account'
}
