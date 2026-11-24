import { useCallback, useEffect, useState } from 'react'
import { isNativeApp } from '@/lib/platform'
import {
  disableNativePush,
  enableNativePush,
  getNativePushState,
  PUSH_STATE_EVENT,
  type NativePushState,
} from '@/lib/push-notifications'
import {
  DEVICE_NOTIFICATION_EVENT,
  disableDeviceNotifications,
  enableDeviceNotifications,
  getDeviceNotificationState,
  showDeviceNotification,
  type DeviceNotificationPayload,
  type DeviceNotificationState,
  type EnableNotificationsResult,
} from '@/lib/device-notifications'

function adaptNativeState(native: NativePushState): DeviceNotificationState {
  return {
    support: { supported: native.supported, reason: null },
    permission: native.permission === 'prompt' ? ('default' as const) : native.permission,
    enabled: native.enabled,
  }
}

function getState(): DeviceNotificationState {
  if (isNativeApp()) {
    return adaptNativeState(getNativePushState())
  }
  return getDeviceNotificationState()
}

export function useDeviceNotifications() {
  const [state, setState] = useState<DeviceNotificationState>(getState)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const sync = () => setState(getState())

    window.addEventListener(DEVICE_NOTIFICATION_EVENT, sync)
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)

    if (isNativeApp()) {
      window.addEventListener(PUSH_STATE_EVENT, sync)
    }

    return () => {
      window.removeEventListener(DEVICE_NOTIFICATION_EVENT, sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
      if (isNativeApp()) {
        window.removeEventListener(PUSH_STATE_EVENT, sync)
      }
    }
  }, [])

  const enable = useCallback(async (): Promise<EnableNotificationsResult> => {
    setBusy(true)
    try {
      if (isNativeApp()) {
        const result = await enableNativePush()
        setState(getState())
        return result.ok
          ? { ok: true }
          : { ok: false, reason: result.reason === 'error' ? ('browser' as const) : result.reason }
      }
      const result = await enableDeviceNotifications()
      setState(getState())
      return result
    } finally {
      setBusy(false)
    }
  }, [])

  const disable = useCallback(() => {
    if (isNativeApp()) {
      void disableNativePush()
    } else {
      disableDeviceNotifications()
    }
    setState(getState())
  }, [])

  const sendTest = useCallback(
    async (payload: DeviceNotificationPayload) => {
      if (isNativeApp()) return false
      const shown = await showDeviceNotification(payload)
      setState(getState())
      return shown
    },
    [],
  )

  return { state, busy, enable, disable, sendTest }
}
