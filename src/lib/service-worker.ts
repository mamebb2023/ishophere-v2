const SERVICE_WORKER_URL = '/sw.js'

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null

/**
 * Register the app service worker once. Safe to call from multiple places.
 * Returns null when service workers are unavailable or registration fails.
 */
export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null)
  }

  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register(SERVICE_WORKER_URL, { scope: '/' })
      .catch(() => {
        // Allow a later call, such as turning notifications on, to retry.
        registrationPromise = null
        return null
      })
  }

  return registrationPromise
}

/** Register once after the first page load in production builds. */
export function registerServiceWorkerOnLoad(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  const register = () => {
    void registerServiceWorker()
  }

  if (document.readyState === 'complete') {
    register()
    return
  }

  window.addEventListener('load', register, { once: true })
}
