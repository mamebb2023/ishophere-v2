const PENDING_CART_KEY = 'ishophere:pending-cart'

export interface PendingCartAction {
  itemId: string
  quantity: number
}

export function setPendingCartAction(itemId: string, quantity: number): void {
  try {
    sessionStorage.setItem(
      PENDING_CART_KEY,
      JSON.stringify({ itemId, quantity } satisfies PendingCartAction),
    )
  } catch {
    // sessionStorage can be unavailable in private mode; ignore.
  }
}

export function takePendingCartAction(): PendingCartAction | null {
  try {
    const raw = sessionStorage.getItem(PENDING_CART_KEY)
    if (!raw) return null
    sessionStorage.removeItem(PENDING_CART_KEY)
    const parsed = JSON.parse(raw) as Partial<PendingCartAction>
    if (typeof parsed.itemId !== 'string' || typeof parsed.quantity !== 'number') {
      return null
    }
    return { itemId: parsed.itemId, quantity: parsed.quantity }
  } catch {
    return null
  }
}
