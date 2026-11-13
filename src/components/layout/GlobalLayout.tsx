import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { resetStoreTheme } from '@/lib/theme'

export function GlobalLayout() {
  useEffect(() => {
    resetStoreTheme()
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-12">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
