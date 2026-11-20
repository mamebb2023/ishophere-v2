import { useCallback, useEffect, useState } from 'react'
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

export function useDeviceNotifications() {
  const [state, setState] = useState<DeviceNotificationState>(
    getDeviceNotificationState,
  )
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const sync = () => setState(getDeviceNotificationState())

    window.addEventListener(DEVICE_NOTIFICATION_EVENT, sync)
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)

    return () => {
      window.removeEventListener(DEVICE_NOTIFICATION_EVENT, sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  const enable = useCallback(async (): Promise<EnableNotificationsResult> => {
    setBusy(true)
    try {
      const result = await enableDeviceNotifications()
      setState(getDeviceNotificationState())
      return result
    } finally {
      setBusy(false)
    }
  }, [])

  const disable = useCallback(() => {
    disableDeviceNotifications()
    setState(getDeviceNotificationState())
  }, [])

  const sendTest = useCallback(
    async (payload: DeviceNotificationPayload) => {
      const shown = await showDeviceNotification(payload)
      setState(getDeviceNotificationState())
      return shown
    },
    [],
  )

  return { state, busy, enable, disable, sendTest }
}
