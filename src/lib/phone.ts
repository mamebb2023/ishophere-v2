// Phone numbers are stored and sent to Supabase in E.164 format.
const PHONE_PATTERN = /^\+[1-9]\d{6,14}$/

export function normalizePhone(value: string): string {
  return value.replace(/[\s().-]/g, '')
}

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(normalizePhone(value))
}
