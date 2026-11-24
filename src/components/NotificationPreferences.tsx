import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useDeviceNotifications } from '@/hooks/useDeviceNotifications'
import { isNativeApp } from '@/lib/platform'

export function NotificationPreferences({ admin = false }: { admin?: boolean }) {
  const { state, busy, enable, disable, sendTest } = useDeviceNotifications()
  const { support, permission, enabled } = state

  const blocked = permission === 'denied'
  const iosInstall = support.reason === 'ios-install'
  const unsupported = support.reason === 'browser'
  const insecure = support.reason === 'insecure'
  const native = isNativeApp()

  const description = admin
    ? 'Get an alert on this device when a new order comes in.'
    : 'Get an alert on this device when an order status changes.'

  async function handleToggle() {
    if (enabled) {
      disable()
      toast.success('Notifications turned off for this device')
      return
    }

    const result = await enable()

    if (result.ok) {
      toast.success('Notifications enabled for this device')
      if (!native) {
        await sendTest({
          title: 'Tofik Store notifications are on',
          body: admin
            ? 'New orders will show up here.'
            : 'Order updates will show up here.',
          tag: 'tofik-welcome',
          url: admin ? '/admin/orders' : '/account',
        })
      }
      return
    }

    if (result.reason === 'denied') {
      toast.error('Notifications are blocked. Allow them in your browser settings.')
    } else if (result.reason === 'ios-install') {
      toast.info('Add Tofik Store to your Home Screen first.')
    } else if (result.reason === 'insecure') {
      toast.error('Notifications need a secure connection.')
    } else if (result.reason !== 'dismissed') {
      toast.error('This browser does not support notifications.')
    }
  }

  async function handleTest() {
    const shown = await sendTest({
      title: 'Tofik Store test notification',
      body: 'Notifications are working on this device.',
      tag: `tofik-test-${Date.now()}`,
      url: admin ? '/admin/orders' : '/account',
    })

    if (shown) {
      toast.success('Test notification sent')
    } else {
      toast.error('Could not show a notification on this device')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            This device
            {enabled ? <Badge variant="success">On</Badge> : null}
            {blocked ? <Badge variant="destructive">Blocked</Badge> : null}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={() => void handleToggle()}
          disabled={busy || !support.supported || blocked}
          aria-label={
            enabled
              ? 'Turn off notifications on this device'
              : 'Turn on notifications on this device'
          }
        />
      </div>

      {native ? (
        <Alert variant="info" title="Push notifications (FCM)">
          Enabling registers this device for native push notifications. Order
          alerts are delivered through Firebase Cloud Messaging, even when the
          app is closed.
        </Alert>
      ) : null}

      {!native && iosInstall ? (
        <Alert variant="info" title="Add to Home Screen first">
          On iPhone and iPad, notifications only work after you add Tofik Store to
          your Home Screen. Tap the Share button, choose “Add to Home Screen”, then
          open the app and turn this on.
        </Alert>
      ) : null}

      {!native && blocked ? (
        <Alert variant="error" title="Notifications are blocked">
          Allow notifications for this site in your browser settings, then reload
          this page.
        </Alert>
      ) : null}

      {!native && insecure ? (
        <Alert variant="error" title="Secure connection required">
          Notifications need HTTPS. They will work once the shop is opened on its
          secure address.
        </Alert>
      ) : null}

      {!native && unsupported ? (
        <Alert variant="info" title="Not supported in this browser">
          Try a current version of Chrome, Edge, Firefox, or Safari.
        </Alert>
      ) : null}

      {!native && enabled ? (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => void handleTest()}>
            <Send />
            Send test notification
          </Button>
        </div>
      ) : null}

      {support.supported && !native ? (
        <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
          {admin
            ? 'New order alerts appear while the admin dashboard is open in this browser, even in a background tab.'
            : 'Order updates appear while Tofik Store is open in this browser, even in a background tab.'}{' '}
          You can turn them off here at any time.
        </p>
      ) : null}
    </div>
  )
}
