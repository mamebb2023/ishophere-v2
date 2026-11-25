import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { App } from '@capacitor/app'
import type { PluginListenerHandle } from '@capacitor/core'
import { Fingerprint, LockKeyhole, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'
import {
  isAppLockEnabled,
  subscribeToAppLock,
  unlockWithBiometrics,
} from '@/lib/biometric'

/** Don't relock for a quick camera, share-sheet, or browser trip. */
const RELOCK_AFTER_MS = 5 * 60_000
/** Ignore the resume event caused by the biometric prompt itself. */
const UNLOCK_GRACE_MS = 10_000

/**
 * Full-screen privacy lock shown over the app when the user has enabled app
 * lock and the app was reopened after being in the background.
 */
export function BiometricLock() {
  const { user, loading, signOut } = useAuth()
  const enabled = useSyncExternalStore(
    subscribeToAppLock,
    isAppLockEnabled,
    () => false,
  )
  const [locked, setLocked] = useState(isAppLockEnabled)
  const [unlocking, setUnlocking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const prompted = useRef(false)
  const hiddenAt = useRef<number | null>(null)
  const lastUnlockedAt = useRef(0)
  const inFlight = useRef(false)

  const handleUnlock = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setUnlocking(true)
    setMessage(null)
    try {
      const result = await unlockWithBiometrics()
      if (result === 'success') {
        prompted.current = false
        lastUnlockedAt.current = Date.now()
        setLocked(false)
      } else if (result === 'failed') {
        setMessage(
          'Could not confirm it’s you. Try again, or use your device PIN.',
        )
      }
    } finally {
      inFlight.current = false
      setUnlocking(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLocked(false)
      setMessage(null)
    }
  }, [enabled])

  // Only a confirmed signed-out state unlocks the app; during startup the
  // session is still loading and the lock must stay in place.
  useEffect(() => {
    if (!loading && !user) setLocked(false)
  }, [loading, user])

  // Lock again after a real absence, not after a quick trip to the camera.
  useEffect(() => {
    if (!enabled) return

    let handle: PluginListenerHandle | undefined
    let cancelled = false

    void App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        hiddenAt.current = Date.now()
        return
      }

      const since = hiddenAt.current
      hiddenAt.current = null
      if (
        since &&
        Date.now() - since >= RELOCK_AFTER_MS &&
        Date.now() - lastUnlockedAt.current >= UNLOCK_GRACE_MS
      ) {
        prompted.current = false
        setMessage(null)
        setLocked(true)
      }
    }).then((registered) => {
      if (cancelled) void registered.remove()
      else handle = registered
    })

    return () => {
      cancelled = true
      void handle?.remove()
    }
  }, [enabled])

  // Prompt once as soon as the lock appears. If it is cancelled, the Unlock
  // button remains available.
  useEffect(() => {
    if (!locked || loading || !user || unlocking || prompted.current) return
    prompted.current = true
    void handleUnlock()
  }, [locked, loading, user, unlocking, handleUnlock])

  async function handleSignOut() {
    try {
      await signOut()
      prompted.current = false
      setLocked(false)
    } catch {
      setMessage('Could not sign out. Check your connection and try again.')
    }
  }

  if (!enabled || !locked) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-lock-title"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-background px-6 text-center"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <img
            src="/icon-192.png"
            alt=""
            className="h-20 w-20 rounded-2xl shadow-md"
          />
          <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border bg-card text-primary shadow-sm">
            <LockKeyhole aria-hidden="true" className="h-4 w-4" />
          </span>
        </div>
        <div>
          <h1
            id="app-lock-title"
            className="text-2xl font-semibold tracking-tight"
          >
            Tofik Store is locked
          </h1>
          <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Unlock with your fingerprint, face, or device PIN to continue.
          </p>
        </div>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button
          size="lg"
          onClick={() => {
            void handleUnlock()
          }}
          disabled={unlocking}
        >
          {unlocking ? <Spinner /> : <Fingerprint />}
          {unlocking ? 'Waiting for unlock…' : 'Unlock'}
        </Button>
        {message ? (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        ) : null}
        <Button
          variant="ghost"
          onClick={() => {
            void handleSignOut()
          }}
        >
          <LogOut />
          Sign out instead
        </Button>
      </div>
    </div>
  )
}
