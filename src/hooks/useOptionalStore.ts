import { useContext } from 'react'
import { StoreContext } from '@/contexts/store-context'

/** Returns the current store, or null on global pages outside a store route. */
export function useOptionalStore() {
  return useContext(StoreContext)
}
