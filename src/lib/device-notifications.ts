import { isNativeApp } from '@/lib/platform'
import { registerServiceWorker } from '@/lib/service-worker'

const ENABLED_KEY = 'tofik-store:notifications-enabled'
const PROMPT_DISMISSED_KEY = 'tofik-store:notification-prompt-dismissed'
const CHANGE_EVENT = 'tofik-store:notifications-changed'

export type NotificationSupportReason = 'browser' | 'insecure' | 'ios-install'

export interface NotificationSupport {
  supported: boolean
  reason: NotificationSupportReason | null
}

export interface DeviceNotificationState {
  support: NotificationSupport
  permission: NotificationPermission | 'unsupported'
  enabled: boolean
}

export interface DeviceNotificationPayload {
  title: string
  body?: string | null
  url?: string
  tag?: string
}

export type EnableNotificationsResult =
  | { ok: true }
  | {
      ok: false
      reason: NotificationSupportReason | 'denied' | 'dismissed'
    }

export const DEVICE_NOTIFICATION_EVENT = CHANGE_EVENT

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** Whether this browser can show notifications at all. */
export function getNotificationSupport(): NotificationSupport {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'browser' }
  }
  // The Android WebView cannot grant Web Notification permission. Native push
  // notifications are a planned follow-up; until then, do not offer the toggle.
  if (isNativeApp()) {
    return { supported: false, reason: 'browser' }
  }
  if (!window.isSecureContext) {
    return { supported: false, reason: 'insecure' }
  }
  if (!('Notification' in window)) {
    return { supported: false, reason: 'browser' }
  }
  if (!('serviceWorker' in navigator)) {
    return { supported: false, reason: 'browser' }
  }
  // iOS only exposes notifications to apps installed on the Home Screen.
  if (isIos() && !isStandalone()) {
    return { supported: false, reason: 'ios-install' }
  }
  return { supported: true, reason: null }
}

function readPreference(): boolean {
  try {
    return window.localStorage.getItem(ENABLED_KEY) !== 'off'
  } catch {
    return true
  }
}

function writePreference(enabled: boolean) {
  try {
    window.localStorage.setItem(ENABLED_KEY, enabled ? 'on' : 'off')
  } catch {
    // The in-memory state still works if storage is unavailable.
  }
}

function emitChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function getDeviceNotificationState(): DeviceNotificationState {
  const support = getNotificationSupport()

  if (!support.supported) {
    return { support, permission: 'unsupported', enabled: false }
  }

  const permission = Notification.permission
  return {
    support,
    permission,
    enabled: permission === 'granted' && readPreference(),
  }
}

export function notificationsEnabled(): boolean {
  return getDeviceNotificationState().enabled
}

export function isPromptDismissed(): boolean {
  try {
    return window.localStorage.getItem(PROMPT_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissNotificationPrompt() {
  try {
    window.localStorage.setItem(PROMPT_DISMISSED_KEY, '1')
  } catch {
    // Ignore storage failures; the current page still hides the prompt.
  }
  emitChange()
}

export async function ensureNotificationWorker(): Promise<ServiceWorkerRegistration | null> {
  const registration = await registerServiceWorker()
  if (!registration) return null

  return navigator.serviceWorker.ready
}

/**
 * Ask the browser for notification permission. Must be called from a user
 * gesture (the toggle or the in-app prompt), never automatically on load.
 */
export async function enableDeviceNotifications(): Promise<EnableNotificationsResult> {
  const support = getNotificationSupport()
  if (!support.supported) {
    return { ok: false, reason: support.reason ?? 'browser' }
  }
  if (Notification.permission === 'denied') {
    return { ok: false, reason: 'denied' }
  }

  let permission: NotificationPermission
  try {
    permission = await Notification.requestPermission()
  } catch {
    return { ok: false, reason: 'browser' }
  }

  if (permission !== 'granted') {
    // Do not keep asking after the native prompt was dismissed or blocked.
    dismissNotificationPrompt()
    return { ok: false, reason: permission === 'denied' ? 'denied' : 'dismissed' }
  }

  writePreference(true)

  try {
    await ensureNotificationWorker()
  } catch {
    // Permission is granted; a later notification attempt can retry the worker.
  }

  dismissNotificationPrompt()
  emitChange()
  return { ok: true }
}

export function disableDeviceNotifications() {
  writePreference(false)
  emitChange()
}

/** Show an OS notification through the service worker. */
export async function showDeviceNotification(
  payload: DeviceNotificationPayload,
): Promise<boolean> {
  if (!notificationsEnabled()) return false

  try {
    const registration = await ensureNotificationWorker()
    if (!registration) return false

    await registration.showNotification(payload.title, {
      body: payload.body ?? undefined,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: payload.tag,
      data: { url: payload.url ?? '/' },
    })
    return true
  } catch {
    return false
  }
}
