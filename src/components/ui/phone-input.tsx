import { useEffect, useRef, useState } from 'react'
import type { CountryCode } from 'libphonenumber-js/min'
import { Input } from '@/components/ui/input'
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  countryFromPhone,
  countryOption,
  splitPhone,
  toE164,
} from '@/lib/phone'
import { cn } from '@/lib/utils'

interface PhoneInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  className?: string
  autoComplete?: string
  'aria-describedby'?: string
}

/**
 * Country dial-code selector plus a national number input.
 * Emits a valid E.164 string, or an empty string while the number is incomplete.
 */
export function PhoneInput({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  placeholder = '50 123 4567',
  className,
  autoComplete = 'tel',
  'aria-describedby': ariaDescribedBy,
}: PhoneInputProps) {
  const initialCountry = countryFromPhone(value) ?? DEFAULT_COUNTRY
  const initial = splitPhone(value, initialCountry)
  const [country, setCountry] = useState<CountryCode>(initial.country)
  const [nationalNumber, setNationalNumber] = useState(initial.nationalNumber)
  const lastEmitted = useRef(value)

  // Sync when the form value changes from the outside (reset, profile load).
  useEffect(() => {
    if (value === lastEmitted.current) return
    const parsed = splitPhone(value, country)
    setCountry(parsed.country)
    setNationalNumber(parsed.nationalNumber)
    lastEmitted.current = value
  }, [value, country])

  function emit(nextCountry: CountryCode, nextNational: string) {
    const e164 = toE164(nextCountry, nextNational) ?? ''
    lastEmitted.current = e164
    onChange(e164)
  }

  function handleCountryChange(code: CountryCode) {
    setCountry(code)
    emit(code, nationalNumber)
  }

  function handleNumberChange(raw: string) {
    setNationalNumber(raw)

    // Pasting a full international number is common; adopt its country.
    if (raw.trim().startsWith('+')) {
      const parsedCountry = countryFromPhone(raw)
      if (parsedCountry) setCountry(parsedCountry)
      emit(parsedCountry ?? country, raw)
      return
    }

    emit(country, raw)
  }

  const selected = countryOption(country)

  return (
    <div className={cn('flex gap-2', className)}>
      <select
        aria-label="Country calling code"
        value={country}
        disabled={disabled}
        onChange={(event) => handleCountryChange(event.target.value as CountryCode)}
        className="h-11 w-36 shrink-0 rounded-lg border border-input bg-background px-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 sm:w-48"
      >
        {COUNTRIES.map((option) => (
          <option key={option.code} value={option.code}>
            {option.flag} {option.dialCode} · {option.name}
          </option>
        ))}
      </select>

      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        value={nationalNumber}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={ariaDescribedBy}
        aria-label={id ? undefined : `Phone number (${selected.dialCode})`}
        onChange={(event) => handleNumberChange(event.target.value)}
        onBlur={onBlur}
        className={cn('min-w-0 flex-1', invalid && 'border-destructive')}
      />
    </div>
  )
}
