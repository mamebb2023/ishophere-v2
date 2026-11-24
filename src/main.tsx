import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import App from '@/App'
import { AuthProvider } from '@/contexts/AuthProvider'
import { CartProvider } from '@/contexts/CartProvider'
import { NotificationsProvider } from '@/contexts/NotificationsProvider'
import { SettingsProvider } from '@/contexts/SettingsProvider'
import { Toaster } from '@/components/ui/sonner'
import { registerServiceWorkerOnLoad } from '@/lib/service-worker'
import { isNativeApp } from '@/lib/platform'
import { registerPushListeners, pushLink } from '@/lib/push-notifications'
import '@/index.css'

registerServiceWorkerOnLoad()

function NativePushHandlers() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isNativeApp()) return

    let cleanup: (() => void) | undefined
    let cancelled = false

    registerPushListeners({
      onAction: (action) => {
        const route = pushLink(action.notification)
        navigate(route)
      },
    }).then((registeredCleanup) => {
      if (!cancelled) {
        cleanup = registeredCleanup
      }
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [navigate])

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
