import {
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
  BiometryType,
  type CheckBiometryResult,
} from '@aparajita/capacitor-biometric-auth'
import { isNativeApp } from '@/lib/platform'

const STORAGE_KEY = 'tofik.app-lock'

const appLockListeners = new Set<() => void>()

/** Lets the lock screen react when the account page toggles app lock. */
export function subscribeToAppLock(listener: () => void): () => void {
  appLockListeners.add(listener)
  return () => {
    appLockListeners.delete(listener)
  }
}

/**
 * Whether the user asked the Android app to lock when it reopens. This is a
 * privacy screen, not encryption: the session itself stays in web storage.
 */
export function isAppLockEnabled(): boolean {
  if (!isNativeApp()) return false
  try {
    return localStorage.getItem(STORAGE_KEY) === 'enabled'
  } catch {
    return false
  }
}

export function setAppLockEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, 'enabled')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage may be unavailable in private browsing.
  }
  for (const listener of appLockListeners) listener()
}

export type BiometricAvailability =
  | { available: true; label: string }
  | { available: false; message: string }

function biometryLabel(type: BiometryType): string {
  switch (type) {
    case BiometryType.faceId:
      return 'Face ID'
    case BiometryType.touchId:
      return 'Touch ID'
    case BiometryType.faceAuthentication:
      return 'Face unlock'
    case BiometryType.irisAuthentication:
      return 'Iris unlock'
    case BiometryType.fingerprintAuthentication:
      return 'Fingerprint'
    default:
      return 'Biometrics'
  }
}

function describe(result: CheckBiometryResult): string {
  if (result.biometryType !== BiometryType.none) {
    return biometryLabel(result.biometryType)
  }
  return 'Device PIN, pattern, or password'
}

/**
 * App lock accepts biometrics or the device screen-lock credential, so having
 * any secure lock configured is enough to enable it.
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  if (!isNativeApp()) {
    return {
      available: false,
      message: 'App lock is available in the Android app.',
    }
  }

  try {
    const result = await BiometricAuth.checkBiometry()
    if (result.isAvailable || result.deviceIsSecure) {
      return { available: true, label: describe(result) }
    }
    return {
      available: false,
      message:
        result.reason ||
        'Set up a fingerprint, face unlock, or screen lock on your device first.',
    }
  } catch {
    return {
      available: false,
      message: 'Could not check this device’s security settings.',
    }
  }
}

export type UnlockOutcome = 'success' | 'cancelled' | 'failed'

/** Show the system biometric or device-credential prompt. */
export async function unlockWithBiometrics(): Promise<UnlockOutcome> {
  try {
    await BiometricAuth.authenticate({
      reason: 'Unlock Tofik Store',
      cancelTitle: 'Cancel',
      androidTitle: 'Unlock Tofik Store',
      androidSubtitle: 'Confirm it’s you to continue',
      allowDeviceCredential: true,
      androidConfirmationRequired: false,
    })
    return 'success'
  } catch (error) {
    if (error instanceof BiometryError) {
      const cancelled: BiometryErrorType[] = [
        BiometryErrorType.appCancel,
        BiometryErrorType.systemCancel,
        BiometryErrorType.userCancel,
        BiometryErrorType.userFallback,
        BiometryErrorType.notInteractive,
      ]
      if (cancelled.includes(error.code)) return 'cancelled'
    }
    return 'failed'
  }
}
