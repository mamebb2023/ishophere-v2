import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { formatPhoneNumber, isInternalEmail, sanitizePhone } from '@/lib/phone'

function metadataString(user: User | null, key: string): string {
  const value = user?.user_metadata?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

// `name` is the canonical metadata key. Older accounts stored `full_name`.
export function getUserName(user: User | null, profile?: Profile | null): string {
  return (
    profile?.name?.trim() ||
    metadataString(user, 'name') ||
    metadataString(user, 'full_name')
  )
}

export function getUserPhone(user: User | null, profile?: Profile | null): string {
  return (
    sanitizePhone(profile?.phone) ||
    sanitizePhone(metadataString(user, 'phone')) ||
    sanitizePhone(user?.phone)
  )
}

/** The customer's real email. Internal auth emails for phone-only accounts are hidden. */
export function getUserEmail(user: User | null, profile?: Profile | null): string {
  const profileEmail = profile?.email?.trim()
  if (profileEmail && !isInternalEmail(profileEmail)) return profileEmail

  const authEmail = user?.email?.trim()
  if (authEmail && !isInternalEmail(authEmail)) return authEmail

  return ''
}

export function getUserIdentifier(user: User | null, profile?: Profile | null): string {
  const phone = getUserPhone(user, profile)
  return phone ? formatPhoneNumber(phone) : getUserEmail(user, profile)
}

export function getUserDisplayName(
  user: User | null,
  profile?: Profile | null,
): string {
  return getUserName(user, profile) || getUserIdentifier(user, profile) || 'Account'
}
