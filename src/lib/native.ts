import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Share } from '@capacitor/share'

/** Light physical feedback for taps. A no-op outside the native app. */
export async function tapFeedback(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    // Haptics are a nicety; never let them block the action.
  }
}

/** Success feedback for completed actions (add to cart, order placed). */
export async function successFeedback(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await Haptics.notification({ type: NotificationType.Success })
  } catch {
    // Ignore unsupported devices.
  }
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'unavailable'

export interface ShareLinkOptions {
  title: string
  text?: string
  url: string
}

/**
 * Share a link through the native share sheet, the Web Share API, or the
 * clipboard, whichever this platform supports.
 */
export async function shareLink(
  options: ShareLinkOptions,
): Promise<ShareOutcome> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: 'Share this item',
      })
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function'
  ) {
    try {
      await navigator.share(options)
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }

  try {
    await navigator.clipboard.writeText(options.url)
    return 'copied'
  } catch {
    return 'unavailable'
  }
}
