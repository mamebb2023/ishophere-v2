import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { NativeShell } from '@/components/layout/NativeShell'
import { RequireAdmin } from '@/components/layout/RequireAdmin'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { ShopLayout } from '@/components/layout/ShopLayout'
import { Account } from '@/pages/account/Account'
import { AdminCategories } from '@/pages/admin/AdminCategories'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminItemForm } from '@/pages/admin/AdminItemForm'
import { AdminItems } from '@/pages/admin/AdminItems'
import { AdminOrders } from '@/pages/admin/AdminOrders'
import { AdminSettings } from '@/pages/admin/AdminSettings'
import { AdminUsers } from '@/pages/admin/AdminUsers'
import { AuthPage } from '@/pages/auth/AuthPage'
import { Download } from '@/pages/Download'
import { DeleteAccountPage } from '@/pages/delete-account/DeleteAccountPage'
import { NotFound } from '@/pages/NotFound'
import { Privacy } from '@/pages/privacy/Privacy'
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
      <ScrollToTop />
      <NativeShell />
      <Routes>
        <Route element={<ShopLayout />}>
          <Route index element={<Home />} />
          <Route path="download" element={<Download />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="delete-account" element={<DeleteAccountPage />} />
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

        <Route
          path="/admin/login"
          element={<Navigate to="/auth?next=/admin" replace />}
        />

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
          <Route path="users" element={<AdminUsers />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </>
  )
}
