import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ExternalLink, Palette, RotateCcw, Save, Settings, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/hooks/useStore'
import { getErrorMessage } from '@/lib/format'
import { formatMoney } from '@/lib/money'
import { storePath } from '@/lib/storeRoutes'
import { DEFAULT_STORE_COLORS } from '@/lib/types'

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/

function applyColors(primary: string, secondary: string, accent: string) {
  const root = document.documentElement
  root.style.setProperty('--brand', primary)
  root.style.setProperty('--brand-2', secondary)
  root.style.setProperty('--brand-accent', accent)
}

export function AdminSettings() {
  const { store, saveStore } = useStore()
  const [name, setName] = useState(store.name)
  const [description, setDescription] = useState(store.description)
  const [primary, setPrimary] = useState(store.primary_color)
  const [secondary, setSecondary] = useState(store.secondary_color)
  const [accent, setAccent] = useState(store.accent_color)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savedRef = useRef(store)

  useEffect(() => {
    setName(store.name)
    setDescription(store.description)
    setPrimary(store.primary_color)
    setSecondary(store.secondary_color)
    setAccent(store.accent_color)
    savedRef.current = store
  }, [store])

  useEffect(() => {
    if (
      HEX_PATTERN.test(primary) &&
      HEX_PATTERN.test(secondary) &&
      HEX_PATTERN.test(accent)
    ) {
      applyColors(primary, secondary, accent)
    }
  }, [primary, secondary, accent])

  useEffect(() => {
    return () => {
      const saved = savedRef.current
      applyColors(
        saved.primary_color,
        saved.secondary_color,
        saved.accent_color,
      )
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (name.trim().length < 2 || name.trim().length > 80) {
      setError('Store name must be between 2 and 80 characters.')
      return
    }
    if (description.trim().length < 2 || description.trim().length > 500) {
      setError('Store description must be between 2 and 500 characters.')
      return
    }
    if (
      !HEX_PATTERN.test(primary) ||
      !HEX_PATTERN.test(secondary) ||
      !HEX_PATTERN.test(accent)
    ) {
      setError('Colors must be 6-digit hex values, e.g. #ea580c.')
      return
    }

    setSaving(true)
    try {
      await saveStore({
        name: name.trim(),
        description: description.trim(),
        primary_color: primary.toLowerCase(),
        secondary_color: secondary.toLowerCase(),
        accent_color: accent.toLowerCase(),
      })
      toast.success('Store settings saved')
    } catch (submitError) {
      const message = getErrorMessage(submitError)
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  function resetToDefaults() {
    setPrimary(DEFAULT_STORE_COLORS.primary_color)
    setSecondary(DEFAULT_STORE_COLORS.secondary_color)
    setAccent(DEFAULT_STORE_COLORS.accent_color)
  }

  return (
    <div>
      <AdminPageHeader
        icon={Settings}
        title="Settings"
        description={`Update ${store.name}'s details and brand colors. Visitors see new colors on their next page load.`}
        action={
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw />
            Reset colors
          </Button>
        }
      />

      {error ? (
        <Alert variant="error" title="Could not save settings" className="mb-4">
          <p>{error}</p>
        </Alert>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[1fr_360px]"
      >
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Store className="h-5 w-5 text-primary" />
              <CardTitle>Store details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="store-name">Store name</Label>
                <Input
                  id="store-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  placeholder="e.g. Corner Market"
                />
                <p className="text-xs text-muted-foreground">
                  Shown in the header, footer, and browser tab.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="store-description">Description</Label>
                <Textarea
                  id="store-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="What does your store offer?"
                />
                <p className="text-xs text-muted-foreground">
                  Shown in the storefront hero and the public store directory.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Storefront address</Label>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 p-3">
                  <Badge variant="outline" className="font-mono font-normal">
                    {storePath(store.slug)}
                  </Badge>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={storePath(store.slug)}>
                      <ExternalLink />
                      Open store
                    </Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The slug is a permanent public address. Only the platform owner
                  can change it.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Brand colors</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                {
                  id: 'primary',
                  label: 'Primary',
                  value: primary,
                  set: setPrimary,
                  hint: 'Buttons, links, and price text.',
                },
                {
                  id: 'secondary',
                  label: 'Secondary',
                  value: secondary,
                  set: setSecondary,
                  hint: 'Gradient partner and highlights.',
                },
                {
                  id: 'accent',
                  label: 'Accent',
                  value: accent,
                  set: setAccent,
                  hint: 'Small accents and badges.',
                },
              ].map((color) => (
                <div key={color.id} className="flex flex-col gap-1.5">
                  <Label htmlFor={`color-${color.id}`}>{color.label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`color-${color.id}`}
                      type="color"
                      value={color.value}
                      onChange={(event) => color.set(event.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-lg border border-input bg-background p-1"
                      aria-label={`${color.label} color picker`}
                    />
                    <Input
                      value={color.value}
                      onChange={(event) => color.set(event.target.value)}
                      maxLength={7}
                      className="font-mono"
                      aria-label={`${color.label} hex value`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{color.hint}</p>
                </div>
              ))}

              <Button type="submit" size="lg" disabled={saving}>
                {saving ? <Spinner /> : <Save />}
                {saving ? 'Saving…' : 'Save settings'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-2xl bg-[linear-gradient(135deg,var(--brand),var(--brand-2))] p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                {name || 'Your store'}
              </p>
              <p className="mt-2 text-xl font-black">Fresh finds, right here.</p>
              <p className="mt-1 line-clamp-2 text-sm text-white/90">
                {description || 'This is how the storefront hero will look.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm">
                Primary
              </Button>
              <Button type="button" size="sm" variant="secondary">
                Secondary
              </Button>
              <Badge variant="default">Only 3 left</Badge>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sample item</span>
                <span className="text-sm font-bold text-primary">
                  {formatMoney(1299)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Prices and actions follow the primary color.
              </p>
            </div>

            <Button type="button" variant="outline" onClick={resetToDefaults}>
              <RotateCcw />
              Reset to defaults
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
