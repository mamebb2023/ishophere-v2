import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { ConfigBanner } from '@/components/layout/ConfigBanner'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { RequireAdmin } from '@/components/layout/RequireAdmin'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { ShopLayout } from '@/components/layout/ShopLayout'
import { Account } from '@/pages/account/Account'
import { AdminCategories } from '@/pages/admin/AdminCategories'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminItemForm } from '@/pages/admin/AdminItemForm'
import { AdminItems } from '@/pages/admin/AdminItems'
import { AdminLogin } from '@/pages/admin/AdminLogin'
import { AdminOrders } from '@/pages/admin/AdminOrders'
import { AdminSettings } from '@/pages/admin/AdminSettings'
import { AuthPage } from '@/pages/auth/AuthPage'
import { NotFound } from '@/pages/NotFound'
import { Cart } from '@/pages/shop/Cart'
import { Checkout } from '@/pages/shop/Checkout'
import { Home } from '@/pages/shop/Home'
import { ItemDetail } from '@/pages/shop/ItemDetail'
import { OrderConfirmation } from '@/pages/shop/OrderConfirmation'

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
