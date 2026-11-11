export const ORDERS_CHANGED_EVENT = 'ishophere:orders-changed'

/** Tell listeners (nav badges, notification bell) that order data changed. */
export function notifyOrdersChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT))
  }
}
