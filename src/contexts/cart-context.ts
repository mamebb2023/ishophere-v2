import { createContext } from 'react'
import type { CartLine } from '@/lib/types'

export interface CartContextValue {
  lines: CartLine[]
  count: number
  subtotalCents: number
  loading: boolean
  error: string | null
  add: (itemId: string, quantity?: number) => Promise<void>
  setQuantity: (itemId: string, quantity: number) => Promise<void>
  remove: (itemId: string) => Promise<void>
  refresh: () => Promise<void>
}

export const CartContext = createContext<CartContextValue | null>(null)
