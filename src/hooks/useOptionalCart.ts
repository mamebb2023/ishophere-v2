import { useContext } from 'react'
import { CartContext } from '@/contexts/cart-context'

/** Returns the current cart, or null on global pages outside a store route. */
export function useOptionalCart() {
  return useContext(CartContext)
}
