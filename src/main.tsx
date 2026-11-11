import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from '@/App'
import { AuthProvider } from '@/contexts/AuthProvider'
import { CartProvider } from '@/contexts/CartProvider'
import { SettingsProvider } from '@/contexts/SettingsProvider'
import { Toaster } from '@/components/ui/sonner'
import '@/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <Toaster />
        </CartProvider>
      </SettingsProvider>
    </AuthProvider>
  </StrictMode>,
)
