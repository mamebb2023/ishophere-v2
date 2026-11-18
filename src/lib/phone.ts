import {
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
} from 'libphonenumber-js/min'
import type { CountryCode } from 'libphonenumber-js/min'

// Phone numbers are stored and sent to Supabase in E.164 format.
const PHONE_PATTERN = /^\+[1-9]\d{6,14}$/

export const INTERNAL_EMAIL_DOMAIN = 'internal.ishophere.app'

export function normalizePhone(value: string): string {
  return value.replace(/[\s().-]/g, '')
}

export function isInternalEmail(value: string | null | undefined): boolean {
  return (
    typeof value === 'string' &&
    value.toLowerCase().endsWith(`@${INTERNAL_EMAIL_DOMAIN}`)
  )
}

export function makeInternalEmail(): string {
  return `u-${crypto.randomUUID()}@${INTERNAL_EMAIL_DOMAIN}`
}

export function isValidPhone(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false

  const number = parsePhoneNumberFromString(trimmed)
  if (number) return number.isValid()

  // Fall back to the storage pattern so old, unparsed values still work.
  return PHONE_PATTERN.test(normalizePhone(trimmed))
}

export interface CountryOption {
  code: CountryCode
  name: string
  dialCode: string
  flag: string
}

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

let countryNames: Intl.DisplayNames | null = null
try {
  countryNames = new Intl.DisplayNames(undefined, { type: 'region' })
} catch {
  countryNames = null
}

function countryName(code: CountryCode): string {
  try {
    return countryNames?.of(code) ?? code
  } catch {
    return code
  }
}

function buildCountries(): CountryOption[] {
  return getCountries()
    .map((code) => ({
      code,
      name: countryName(code),
      dialCode: `+${getCountryCallingCode(code)}`,
      flag: countryFlag(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const COUNTRIES: CountryOption[] = buildCountries()

export const DEFAULT_COUNTRY: CountryCode = (() => {
  if (typeof navigator !== 'undefined') {
    try {
      const region = new Intl.Locale(navigator.language).region
      if (region && isSupportedCountry(region)) return region
    } catch {
      // Ignore unsupported browser locales.
    }
  }
  return 'SA'
})()

export function countryOption(code: CountryCode): CountryOption {
  return (
    COUNTRIES.find((country) => country.code === code) ??
    COUNTRIES.find((country) => country.code === DEFAULT_COUNTRY) ?? {
      code: DEFAULT_COUNTRY,
      name: DEFAULT_COUNTRY,
      dialCode: '',
      flag: countryFlag(DEFAULT_COUNTRY),
    }
  )
}

export function countryFromPhone(value: string | null | undefined): CountryCode | null {
  if (!value) return null
  const number = parsePhoneNumberFromString(value)
  return number?.country ?? null
}

/** Convert a country + national number into a valid E.164 string, or null. */
export function toE164(country: CountryCode, nationalNumber: string): string | null {
  const raw = nationalNumber.trim()
  if (!raw) return null

  const number = raw.startsWith('+')
    ? parsePhoneNumberFromString(raw)
    : parsePhoneNumberFromString(raw, country)

  if (!number || !number.isValid()) return null
  return number.number
}

/** Split a stored E.164 string into a country and national number for editing. */
export function splitPhone(
  value: string | null | undefined,
  fallbackCountry: CountryCode = DEFAULT_COUNTRY,
): { country: CountryCode; nationalNumber: string } {
  if (!value) return { country: fallbackCountry, nationalNumber: '' }

  const number = parsePhoneNumberFromString(value)
  if (number?.country) {
    return {
      country: number.country,
      nationalNumber: number.nationalNumber,
    }
  }

  return { country: fallbackCountry, nationalNumber: value.replace(/^\+/, '') }
}

/** Format a stored value for display, e.g. "+966 50 123 4567". */
export function formatPhoneNumber(value: string | null | undefined): string {
  if (!value) return ''
  const number = parsePhoneNumberFromString(value)
  return number ? number.formatInternational() : value
}

/** Normalize stored metadata into a valid E.164 value, or an empty string. */
export function sanitizePhone(value: string | null | undefined): string {
  if (!value) return ''
  const number = parsePhoneNumberFromString(value)
  if (number?.isValid()) return number.number

  const normalized = normalizePhone(value.trim())
  return PHONE_PATTERN.test(normalized) ? normalized : ''
}
