import { useEffect, useState } from 'react'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Network } from '@capacitor/network'
import { WifiOff } from 'lucide-react'

/**
 * Native-only shell behavior: Android back navigation and an offline banner.
 * On the web this component renders nothing and registers no listeners.
 */
export function NativeShell() {
  const native = Capacitor.isNativePlatform()
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if (!native) return

    let active = true
    const handles: PluginListenerHandle[] = []

    const keep = (handle: PluginListenerHandle) => {
      if (active) handles.push(handle)
      else void handle.remove()
    }

    void App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        void App.minimizeApp()
      }
    }).then(keep)

    void Network.getStatus().then((status) => {
      if (active) setOffline(!status.connected)
    })

    void Network.addListener('networkStatusChange', (status) => {
      if (active) setOffline(!status.connected)
    }).then(keep)

    return () => {
      active = false
      handles.forEach((handle) => void handle.remove())
    }
  }, [native])

  if (!native || !offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-sm items-start gap-2.5 rounded-xl border bg-card p-4 text-sm shadow-lg md:bottom-6"
    >
      <WifiOff
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
      />
      <span className="leading-relaxed">
        You're offline. Some prices, stock, or account details may be out of
        date until you reconnect.
      </span>
    </div>
  )
}
