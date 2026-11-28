import { Outlet } from 'react-router-dom'
import { DeviceNotificationPrompt } from '@/components/layout/DeviceNotificationPrompt'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { SkipLink } from '@/components/layout/SkipLink'

export function ShopLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <Header />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-safe pb-mobile-nav pt-4"
      >
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
      <DeviceNotificationPrompt />
    </div>
  )
}
