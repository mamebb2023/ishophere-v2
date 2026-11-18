import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { CountryCode } from 'libphonenumber-js/min'
import { Check, ChevronDown } from 'lucide-react'
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

function flagUrl(code: CountryCode): string {
  return `https://flagcdn.com/w20/${code.toLowerCase()}.png`
}

/**
 * Phone number input with a searchable country dial-code field.
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
  const [listOpen, setListOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [countryQuery, setCountryQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const [openUp, setOpenUp] = useState(false)
  const lastEmitted = useRef(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const countryTerm = countryQuery.trim().toLowerCase().replace(/^\+/, '')
  const matches = countryTerm
    ? COUNTRIES.filter((option) => {
        const dialCode = option.dialCode.slice(1)
        return (
          option.name.toLowerCase().includes(countryTerm) ||
          option.code.toLowerCase().startsWith(countryTerm) ||
          dialCode.startsWith(countryTerm) ||
          dialCode.includes(countryTerm)
        )
      })
    : COUNTRIES

  // Sync when the form value changes from the outside (reset, profile load).
  useEffect(() => {
    if (value === lastEmitted.current) return
    const parsed = splitPhone(value, country)
    setCountry(parsed.country)
    setNationalNumber(parsed.nationalNumber)
    lastEmitted.current = value
  }, [value, country])

  // Close the country list when the user interacts outside this field.
  useEffect(() => {
    if (!listOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setListOpen(false)
        setSearching(false)
        setCountryQuery('')
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [listOpen])

  function emit(nextCountry: CountryCode, nextNational: string) {
    const e164 = toE164(nextCountry, nextNational) ?? ''
    lastEmitted.current = e164
    onChange(e164)
  }

  function openList() {
    const bounds = containerRef.current?.getBoundingClientRect()
    if (bounds) {
      const spaceBelow = window.innerHeight - bounds.bottom
      const spaceAbove = bounds.top
      setOpenUp(spaceBelow < 280 && spaceAbove > spaceBelow)
    }

    setListOpen(true)
    setSearching(false)
    setCountryQuery('')
    const selectedIndex = COUNTRIES.findIndex((option) => option.code === country)
    setHighlighted(selectedIndex >= 0 ? selectedIndex : 0)
  }

  function closeList() {
    setListOpen(false)
    setSearching(false)
    setCountryQuery('')
  }

  function selectCountry(code: CountryCode) {
    setCountry(code)
    emit(code, nationalNumber)
    closeList()
  }

  function handleCountryInputChange(raw: string) {
    setSearching(true)
    setCountryQuery(raw)
    setHighlighted(0)
    setListOpen(true)
  }

  function handleCountryKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!listOpen) {
        openList()
        return
      }
      setHighlighted((current) => Math.min(current + 1, matches.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!listOpen) return
      setHighlighted((current) => Math.max(current - 1, 0))
      return
    }

    if (event.key === 'Enter') {
      if (listOpen && matches[highlighted]) {
        event.preventDefault()
        selectCountry(matches[highlighted].code)
      }
      return
    }

    if (event.key === 'Escape') {
      if (listOpen) {
        event.preventDefault()
        closeList()
      }
      return
    }

    if (event.key === 'Tab') closeList()
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

  const activeOption = listOpen ? matches[highlighted] : undefined
  const countryFieldValue =
    listOpen && searching ? countryQuery : selected.dialCode

  // Keep the keyboard-highlighted country visible in the scrollable list.
  useEffect(() => {
    if (!listOpen || !activeOption) return
    document
      .getElementById(`${listId}-${activeOption.code}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [listOpen, activeOption, listId])

  return (
    <div className={cn('flex gap-2', className)}>
      <div ref={containerRef} className="relative shrink-0">
        <Input
          type="text"
          inputMode="text"
          autoComplete="off"
          role="combobox"
          aria-label="Country calling code"
          aria-expanded={listOpen}
          aria-controls={listOpen ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            activeOption ? `${listId}-${activeOption.code}` : undefined
          }
          value={countryFieldValue}
          disabled={disabled}
          placeholder={selected.dialCode}
          onChange={(event) => handleCountryInputChange(event.target.value)}
          onFocus={(event) => {
            openList()
            event.currentTarget.select()
          }}
          onClick={(event) => {
            if (!listOpen) {
              openList()
              event.currentTarget.select()
            }
          }}
          onKeyDown={handleCountryKeyDown}
          className="h-11 w-32 pl-9 pr-7 text-sm sm:w-36"
        />
        {listOpen && searching ? null : (
          <img
            src={flagUrl(selected.code)}
            alt=""
            onError={(event) => {
              event.currentTarget.style.visibility = 'hidden'
            }}
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-5 -translate-y-1/2 rounded-[2px] object-cover"
          />
        )}
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        {listOpen ? (
          <div
            id={listId}
            role="listbox"
            aria-label="Countries"
            className={cn(
              'absolute left-0 z-50 max-h-64 w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg',
              openUp ? 'bottom-full mb-1' : 'top-full mt-1',
            )}
          >
            {matches.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                No countries found.
              </p>
            ) : (
              matches.map((option, index) => (
                <button
                  key={option.code}
                  id={`${listId}-${option.code}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={option.code === country}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectCountry(option.code)}
                  onMouseEnter={() => setHighlighted(index)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                    index === highlighted && 'bg-accent text-accent-foreground',
                    option.code === country && 'font-medium',
                  )}
                >
                  <img
                    src={flagUrl(option.code)}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.visibility = 'hidden'
                    }}
                    className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate">{option.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {option.dialCode}
                  </span>
                  {option.code === country ? (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  ) : null}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

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
