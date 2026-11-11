import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { ConfigBanner } from '@/components/layout/ConfigBanner'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { RequireAdmin } from '@/components/layout/RequireAdmin'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { ShopLayout } from '@/components/layout/ShopLayout'
import { Account } from '@/pages/Account'
import { AdminCategories } from '@/pages/AdminCategories'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { AdminItemForm } from '@/pages/AdminItemForm'
import { AdminItems } from '@/pages/AdminItems'
import { AdminLogin } from '@/pages/AdminLogin'
import { AdminOrders } from '@/pages/AdminOrders'
import { AdminSettings } from '@/pages/AdminSettings'
import { AuthPage } from '@/pages/AuthPage'
import { Cart } from '@/pages/Cart'
import { Checkout } from '@/pages/Checkout'
import { Home } from '@/pages/Home'
import { ItemDetail } from '@/pages/ItemDetail'
import { NotFound } from '@/pages/NotFound'
import { OrderConfirmation } from '@/pages/OrderConfirmation'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default function App() {
  return (
    <>
      <ConfigBanner />
      <ScrollToTop />
      <Routes>
        <Route element={<ShopLayout />}>
          <Route index element={<Home />} />
          <Route path="item/:id" element={<ItemDetail />} />
          <Route path="auth" element={<AuthPage />} />
          <Route
            path="account"
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />
          <Route
            path="cart"
            element={
              <RequireAuth>
                <Cart />
              </RequireAuth>
            }
          />
          <Route
            path="checkout"
            element={
              <RequireAuth>
                <Checkout />
              </RequireAuth>
            }
          />
          <Route
            path="order/:id"
            element={
              <RequireAuth>
                <OrderConfirmation />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="items" element={<AdminItems />} />
          <Route path="items/new" element={<AdminItemForm />} />
          <Route path="items/:id/edit" element={<AdminItemForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </>
  )
}
