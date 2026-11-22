import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BellRing, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'
import { useDeviceNotifications } from '@/hooks/useDeviceNotifications'
import {
  dismissNotificationPrompt,
  isPromptDismissed,
} from '@/lib/device-notifications'
import { cn } from '@/lib/utils'

const HIDDEN_PATHS = ['/auth', '/account', '/admin/settings']

export function DeviceNotificationPrompt({ admin = false }: { admin?: boolean }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { state, busy, enable } = useDeviceNotifications()
  const [hidden, setHidden] = useState(false)

  const show =
    Boolean(user) &&
    state.support.supported &&
    state.permission === 'default' &&
    !hidden &&
    !isPromptDismissed() &&
    !HIDDEN_PATHS.includes(pathname)

  if (!show) return null

  function dismiss() {
    setHidden(true)
    dismissNotificationPrompt()
  }

  async function handleEnable() {
    const result = await enable()
    dismiss()

    if (result.ok) {
      toast.success('Notifications enabled for this device')
    } else if (result.reason === 'denied') {
      toast.error('Notifications are blocked. Allow them in your browser settings.')
    } else if (result.reason === 'ios-install') {
      toast.info('Add Tofik Store to your Home Screen first.')
    } else if (result.reason === 'insecure') {
      toast.error('Notifications need a secure connection.')
    } else if (result.reason !== 'dismissed') {
      toast.error('This browser does not support notifications.')
    }
  }

  return (
    <aside
      aria-label="Notification request"
      className={cn(
        'fixed inset-x-4 z-30 rounded-2xl border bg-card p-4 shadow-lg sm:left-auto sm:right-6 sm:w-[22rem]',
        admin
          ? 'bottom-[calc(1rem+env(safe-area-inset-bottom))] md:bottom-6'
          : 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6',
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <BellRing className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {admin ? 'New order alerts' : 'Order updates'}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {admin
              ? 'Turn on notifications on this device so you do not miss an order while the dashboard is open.'
              : 'Turn on notifications on this device to hear when your order status changes.'}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="-mr-2 -mt-2"
          onClick={dismiss}
          aria-label="Dismiss notification request"
        >
          <X />
        </Button>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
          Not now
        </Button>
        <Button type="button" size="sm" onClick={() => void handleEnable()} disabled={busy}>
          {busy ? <Spinner /> : <BellRing />}
          Enable
        </Button>
      </div>
    </aside>
  )
}
