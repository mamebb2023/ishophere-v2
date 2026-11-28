import { useEffect, useRef, useState } from 'react'
import { ExternalLink, LocateFixed, MapPin, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

export interface SelectedLocation {
  label: string
  lat: number
  lng: number
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface LocationPickerProps {
  value: SelectedLocation | null
  onChange: (location: SelectedLocation | null) => void
}

function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  async function runSearch() {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setSearching(true)
    setError(null)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(trimmed)}&limit=5`,
        {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        },
      )
      if (!response.ok) {
        throw new Error('Could not search locations right now.')
      }
      const data = (await response.json()) as NominatimResult[]
      setResults(data)
      if (data.length === 0) {
        setError('No matching locations found. Try a nearby landmark or street.')
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError('Could not search locations. Check your connection and try again.')
    } finally {
      setSearching(false)
    }
  }

  function handleSelectResult(result: NominatimResult) {
    const lat = Number.parseFloat(result.lat)
    const lng = Number.parseFloat(result.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    onChange({
      label: result.display_name,
      lat,
      lng,
    })
    setQuery(result.display_name)
    setResults([])
    setError(null)
  }

  function handleLocateMe() {
    if (!('geolocation' in navigator)) {
      setError('Location access is not supported on this device.')
      return
    }

    setLocating(true)
    setError(null)
    setResults([])

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        let label = formatCoords(lat, lng)

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { Accept: 'application/json' } },
          )
          if (response.ok) {
            const data = (await response.json()) as { display_name?: string }
            if (data.display_name) {
              label = data.display_name
            }
          }
        } catch {
          // Keep coordinate fallback when reverse geocoding is unavailable.
        }

        onChange({ label, lat, lng })
        setQuery(label)
        setLocating(false)
      },
      (geoError) => {
        setLocating(false)
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError('Location permission denied. Search for your address instead.')
        } else if (geoError.code === geoError.TIMEOUT) {
          setError('Location request timed out. Try again or search instead.')
        } else {
          setError('Could not detect your location. Try searching instead.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  function handleClear() {
    onChange(null)
    setQuery('')
    setResults([])
    setError(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="delivery-location-search">
          Delivery location{' '}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLocateMe}
          disabled={locating}
          className="h-8 gap-1.5 text-xs"
        >
          {locating ? <Spinner /> : <LocateFixed className="h-3.5 w-3.5" />}
          {locating ? 'Locating…' : 'Use my location'}
        </Button>
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="delivery-location-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                if (error) setError(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void runSearch()
                }
              }}
              placeholder="Search street, neighborhood, or landmark…"
              className="pl-9 pr-8"
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear location"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void runSearch()}
            disabled={searching || !query.trim()}
          >
            {searching ? <Spinner /> : 'Search'}
          </Button>
        </div>

        {results.length > 0 ? (
          <ul
            role="listbox"
            aria-label="Location search results"
            className="mt-1.5 max-h-52 divide-y overflow-y-auto rounded-xl border bg-popover shadow-md"
          >
            {results.map((result) => (
              <li key={result.place_id}>
                <button
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="line-clamp-2">{result.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {value ? (
        <div className="overflow-hidden rounded-xl border bg-muted/30">
          <div className="flex items-center justify-between gap-2 border-b bg-card px-3 py-2 text-xs">
            <div className="flex min-w-0 items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate font-medium">{value.label}</span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${value.lat},${value.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline"
            >
              Google Maps
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <iframe
            title="Selected delivery location on Google Maps"
            src={`https://maps.google.com/maps?q=${value.lat},${value.lng}&z=16&output=embed`}
            className="h-48 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
    </div>
  )
}
