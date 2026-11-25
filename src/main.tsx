import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import App from '@/App'
import { AuthProvider } from '@/contexts/AuthProvider'
import { CartProvider } from '@/contexts/CartProvider'
import { NotificationsProvider } from '@/contexts/NotificationsProvider'
import { SettingsProvider } from '@/contexts/SettingsProvider'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/hooks/useAuth'
import { registerServiceWorkerOnLoad } from '@/lib/service-worker'
import { isNativeApp } from '@/lib/platform'
import {
  registerDeviceForPush,
  registerPushListeners,
  pushLink,
} from '@/lib/push-notifications'
import '@/index.css'

registerServiceWorkerOnLoad()

function NativePushHandlers() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id

  useEffect(() => {
    if (!isNativeApp() || !userId) return

    let cleanup: (() => void) | undefined
    let cancelled = false

    registerPushListeners({
      onAction: (action) => {
        const route = pushLink(action.notification)
        navigate(route)
      },
    }).then((registeredCleanup) => {
      if (cancelled) {
        registeredCleanup()
        return
      }
      cleanup = registeredCleanup
      // Save this device's token for the signed-in account (never prompts).
      void registerDeviceForPush()
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [navigate, userId])

  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NotificationsProvider>
        <SettingsProvider>
          <CartProvider>
            <BrowserRouter>
              <NativePushHandlers />
              <App />
              <Toaster />
            </BrowserRouter>
          </CartProvider>
        </SettingsProvider>
      </NotificationsProvider>
    </AuthProvider>
  </StrictMode>,
)
