import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ConfigBanner } from "@/components/layout/ConfigBanner";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DevLayout } from "@/components/layout/DevLayout";
import { GlobalLayout } from "@/components/layout/GlobalLayout";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { RequireDev } from "@/components/layout/RequireDev";
import { RequireStoreAdmin } from "@/components/layout/RequireStoreAdmin";
import { ShopLayout } from "@/components/layout/ShopLayout";
import { StoreScope } from "@/components/layout/StoreScope";
import { Account } from "@/pages/account/Account";
import { AdminCategories } from "@/pages/admin/AdminCategories";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminEntry } from "@/pages/admin/AdminEntry";
import { AdminItemForm } from "@/pages/admin/AdminItemForm";
import { AdminItems } from "@/pages/admin/AdminItems";
import { AdminLogin } from "@/pages/admin/AdminLogin";
import { AdminOrders } from "@/pages/admin/AdminOrders";
import { AdminSettings } from "@/pages/admin/AdminSettings";
import { AuthPage } from "@/pages/auth/AuthPage";
import { DevDashboard } from "@/pages/dev/DevDashboard";
import { DevStoreNew } from "@/pages/dev/DevStoreNew";
import { DevStores } from "@/pages/dev/DevStores";
import { Landing } from "@/pages/Landing";
import { NotFound } from "@/pages/NotFound";
import { Cart } from "@/pages/shop/Cart";
import { Checkout } from "@/pages/shop/Checkout";
import { Home } from "@/pages/shop/Home";
import { ItemDetail } from "@/pages/shop/ItemDetail";
import { OrderConfirmation } from "@/pages/shop/OrderConfirmation";
import { StoresDirectory } from "@/pages/stores/StoresDirectory";
import { AuthProvider } from "@/contexts/AuthProvider";
import { NotificationsProvider } from "@/contexts/NotificationsProvider";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <BrowserRouter>
          <ConfigBanner />
          <ScrollToTop />
          <Toaster />

          <Routes>
            <Route element={<GlobalLayout />}>
              <Route index element={<Landing />} />
              <Route path="stores" element={<StoresDirectory />} />
              <Route path="auth" element={<AuthPage />} />
              <Route
                path="account"
                element={
                  <RequireAuth>
                    <Account />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminEntry />} />

            <Route
              path="/dev"
              element={
                <RequireDev>
                  <DevLayout />
                </RequireDev>
              }
            >
              <Route index element={<DevDashboard />} />
              <Route path="stores" element={<DevStores />} />
              <Route path="stores/new" element={<DevStoreNew />} />
            </Route>

            <Route path="/s/:storeSlug" element={<StoreScope />}>
              <Route element={<ShopLayout />}>
                <Route index element={<Home />} />
                <Route path="item/:id" element={<ItemDetail />} />
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
              </Route>

              <Route
                path="admin"
                element={
                  <RequireStoreAdmin>
                    <AdminLayout />
                  </RequireStoreAdmin>
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
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationsProvider>
    </AuthProvider>
  );
}
