import { Outlet, useParams } from 'react-router-dom'
import { StoreProvider } from '@/contexts/StoreProvider'
import { CartProvider } from '@/contexts/CartProvider'

export function StoreScope() {
  const { storeSlug } = useParams<{ storeSlug: string }>()

  return (
    <StoreProvider key={storeSlug ?? ''} slug={storeSlug ?? ''}>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </StoreProvider>
  )
}
