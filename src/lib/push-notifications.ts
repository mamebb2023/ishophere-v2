import { Capacitor } from '@capacitor/core'
import type { PluginListenerHandle } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import type {
  ActionPerformed,
  PushNotificationSchema,
  Token,
} from '@capacitor/push-notifications'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { isNativeApp } from '@/lib/platform'

const ENABLED_KEY = 'tofik-store:push-enabled'
const TOKEN_KEY = 'tofik-store:push-token'
const CHANGE_EVENT = 'tofik-store:push-changed'

export const PUSH_STATE_EVENT = CHANGE_EVENT

type PushPermission = 'granted' | 'denied' | 'prompt'

export interface NativePushState {
  supported: boolean
  permission: PushPermission | 'unsupported'
  enabled: boolean
}

export type EnablePushResult =
  | { ok: true }
  | { ok: false; reason: 'denied' | 'dismissed' | 'error' }

/** Android notification channel shown in system settings. */
export async function ensurePushChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return
  }

  try {
    await PushNotifications.createChannel({
      id: 'orders',
      name: 'Order updates',
      description: 'New orders and order status changes',
      importance: 4,
      vibration: true,
      lights: true,
    })
  } catch {
    // A missing channel only downgrades styling, not delivery.
  }
}

// Push is opt-in: a fresh install stays off until the user turns it on.
function readPreference(): boolean {
  try {
    return window.localStorage.getItem(ENABLED_KEY) === 'on'
  } catch {
    return false
  }
}

function writePreference(enabled: boolean) {
  try {
    window.localStorage.setItem(ENABLED_KEY, enabled ? 'on' : 'off')
  } catch {
    // In-memory state still works when storage is unavailable.
  }
}

export function getNativePushState(): NativePushState {
  if (!isNativeApp()) {
    return { supported: false, permission: 'unsupported', enabled: false }
  }

  const preference = readPreference()
  // On Android < 13 permission is auto-granted at install time; the OS does
  // not report a per-run prompt state we can distinguish, so treat the
  // preference as the source of truth and let requestPermissions() confirm.
  return { supported: true, permission: 'granted', enabled: preference }
}

async function currentPermission(): Promise<PushPermission> {
  try {
    const { receive } = await PushNotifications.checkPermissions()
    return receive === 'granted' ? 'granted' : receive === 'denied' ? 'denied' : 'prompt'
  } catch {
    return 'denied'
  }
}

async function saveToken(token: string): Promise<void> {
  if (!isSupabaseConfigured) return

  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user?.id
  if (!userId) return

  // Idempotent: the (user_id, token) unique constraint keeps one row per
  // device. ignoreDuplicates maps to ON CONFLICT DO NOTHING, so the insert
  // path needs no UPDATE grant (the table grants select/insert/delete only).
  const { error } = await supabase
    .from('device_tokens')
    .upsert(
      { user_id: userId, token, platform: Capacitor.getPlatform() },
      { onConflict: 'user_id,token', ignoreDuplicates: true },
    )

  if (error) {
    console.error('push: could not save device token', error)
  }
}

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeStoredToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Without storage the token simply cannot be cleaned up on sign-out.
  }
}

/**
 * Delete this device's token for the signed-in user. RLS
 * (device_tokens_delete_own) limits the delete to their own rows, and other
 * devices of the same user keep working. Call it before signing out so the
 * next person on this device does not inherit the previous user's alerts.
 */
export async function removeCurrentDeviceToken(): Promise<void> {
  if (!isNativeApp() || !isSupabaseConfigured) return

  const token = readStoredToken()
  if (!token) return

  const { error } = await supabase
    .from('device_tokens')
    .delete()
    .eq('token', token)

  if (error) {
    console.error('push: could not remove device token', error)
    return
  }
  writeStoredToken(null)
}

export interface PushListeners {
  onNotification?: (payload: PushNotificationSchema) => void
  onAction?: (action: ActionPerformed) => void
}

/**
 * Wire up push listeners once for the whole app. Returns a cleanup that
 * removes only this caller's handles so contexts can mount/unmount freely.
 */
export async function registerPushListeners(
  listeners: PushListeners,
): Promise<() => void> {
  if (!isNativeApp()) return () => {}

  const registrations: Promise<PluginListenerHandle>[] = [
    PushNotifications.addListener('registration', (token: Token) => {
      writeStoredToken(token.value)
      void saveToken(token.value)
    }),
    PushNotifications.addListener('registrationError', (error) => {
      console.error('push: registration error', error)
    }),
  ]

  if (listeners.onNotification) {
    registrations.push(
      PushNotifications.addListener(
        'pushNotificationReceived',
        listeners.onNotification,
      ),
    )
  }

  if (listeners.onAction) {
    registrations.push(
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        listeners.onAction,
      ),
    )
  }

  // Wait until every listener is attached so a registration event fired by a
  // register() call right after this returns cannot be missed.
  const handles = await Promise.all(registrations)

  return () => {
    handles.forEach((handle) => void handle.remove())
  }
}

/**
 * Register for FCM push after the user opts in. Must be called from a user
 * gesture. Resolves once the token is saved to the database.
 */
export async function enableNativePush(): Promise<EnablePushResult> {
  if (!isNativeApp()) return { ok: false, reason: 'error' }

  let permission: PushPermission = await currentPermission()
  if (permission === 'prompt') {
    try {
      const { receive } = await PushNotifications.requestPermissions()
      permission = receive === 'granted' ? 'granted' : receive === 'denied' ? 'denied' : 'prompt'
    } catch {
      return { ok: false, reason: 'denied' }
    }
  }

  if (permission === 'denied') {
    return { ok: false, reason: 'denied' }
  }

  writePreference(true)
  await ensurePushChannel()

  try {
    // register() resolves immediately; the 'registration' listener attached
    // elsewhere persists the token when it arrives.
    await PushNotifications.register()
    window.dispatchEvent(new Event(CHANGE_EVENT))
    return { ok: true }
  } catch (error) {
    console.error('push: register failed', error)
    return { ok: false, reason: 'error' }
  }
}

/**
 * Re-register this device for the signed-in user when push is already on.
 * Called after sign-in so the FCM token is saved against that account. It
 * never prompts: it does nothing unless permission was already granted.
 */
export async function registerDeviceForPush(): Promise<void> {
  if (!isNativeApp() || !readPreference()) return
  if ((await currentPermission()) !== 'granted') return

  await ensurePushChannel()

  try {
    await PushNotifications.register()
  } catch (error) {
    console.error('push: register failed', error)
  }
}

/**
 * Turn push off: remove this device's token server-side and unregister with
 * FCM so no more messages are delivered to this device.
 */
export async function disableNativePush(): Promise<void> {
  if (!isNativeApp()) return

  writePreference(false)
  window.dispatchEvent(new Event(CHANGE_EVENT))

  await removeCurrentDeviceToken()

  try {
    await PushNotifications.unregister()
  } catch (error) {
    console.error('push: unregister failed', error)
  }
}

/** Open the deep link carried by a push notification. */
export function pushLink(notification: PushNotificationSchema): string {
  const data = notification.data as { link?: string; orderId?: string } | null
  const raw = data?.link
  if (raw) {
    // Absolute tofik.store links become in-app routes.
    try {
      const url = new URL(raw)
      if (url.hostname === 'tofik.store') return `${url.pathname}${url.search}`
      return raw
    } catch {
      return raw
    }
  }
  const orderId = data?.orderId
  return orderId ? `/order/${orderId}` : '/account'
}
