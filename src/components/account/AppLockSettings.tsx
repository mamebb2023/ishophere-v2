import {
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import { Fingerprint } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import {
  checkBiometricAvailability,
  isAppLockEnabled,
  setAppLockEnabled,
  subscribeToAppLock,
  unlockWithBiometrics,
  type BiometricAvailability,
} from '@/lib/biometric'
import { isNativeApp } from '@/lib/platform'

/**
 * Android-only setting that requires biometrics or the device lock when the
 * app is reopened. Hidden entirely on the web.
 */
export function AppLockSettings() {
  const enabled = useSyncExternalStore(
    subscribeToAppLock,
    isAppLockEnabled,
    () => false,
  )
  const [availability, setAvailability] =
    useState<BiometricAvailability | null>(null)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isNativeApp()) {
      setChecking(false)
      return
    }

    let cancelled = false
    void checkBiometricAvailability().then((result) => {
      if (cancelled) return
      setAvailability(result)
      setChecking(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (!isNativeApp()) return null

  async function handleToggle(next: boolean) {
    if (!next) {
      setAppLockEnabled(false)
      toast.success('App lock is off')
      return
    }

    setBusy(true)
    const result = await checkBiometricAvailability()
    if (!result.available) {
      setBusy(false)
      toast.error(result.message)
      return
    }

    const unlocked = await unlockWithBiometrics()
    setBusy(false)
    if (unlocked === 'failed') {
      toast.error('Could not confirm it’s you. Try again.')
      return
    }
    if (unlocked !== 'success') return

    setAppLockEnabled(true)
    toast.success('App lock is on')
  }

  const unavailable = availability?.available === false

  return (
    <Card>
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Fingerprint aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-snug tracking-tight">
            App lock
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Require your fingerprint, face, or device PIN when the app reopens.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex max-w-sm items-center justify-between gap-4 rounded-xl border bg-muted/30 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Unlock with biometrics</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {checking
                ? 'Checking device security…'
                : unavailable
                  ? availability.message
                  : availability
                    ? `Uses ${availability.label}.`
                    : 'Available in the Android app.'}
            </p>
          </div>
          {busy || checking ? (
            <span className="flex h-11 w-12 items-center justify-center">
              <Spinner />
            </span>
          ) : (
            <Switch
              checked={enabled}
              onCheckedChange={(next) => {
                void handleToggle(next)
              }}
              disabled={unavailable && !enabled}
              aria-label="Unlock Tofik Store with biometrics"
            />
          )}
        </div>
        {enabled ? (
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">
            The app locks after it has been in the background for a few
            minutes. If biometrics stop working, sign out and use your
            password.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
