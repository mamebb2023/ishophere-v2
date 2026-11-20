/* Tofik Store service worker: shows device notifications and handles clicks. */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const target = new URL(
    event.notification.data?.url || '/',
    self.location.origin,
  ).href

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of windows) {
        if (new URL(client.url).origin !== self.location.origin) continue
        await client.focus()
        if ('navigate' in client) await client.navigate(target)
        return
      }

      await self.clients.openWindow(target)
    })(),
  )
})

/* Ready for future Web Push delivery when the shop runs a push service. */
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Tofik Store', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Tofik Store', {
      body: payload.body || undefined,
      icon: '/logo.png',
      badge: '/logo.png',
      data: { url: payload.url || '/' },
    }),
  )
})
