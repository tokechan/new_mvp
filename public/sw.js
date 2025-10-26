/* Placeholder service worker for upcoming Web Push support.
 * Currently only ensures the worker is ready and can surface test notifications
 * once subscriptions are wired up. Replace handlers with domain logic later.
 */

self.addEventListener('install', () => {
  // Activate the worker immediately after installation.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Claim clients so updates propagate without requiring a manual reload.
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: '通知', body: event.data.text() }
  }

  const title = payload.title ?? '通知'
  const options = {
    body: payload.body,
    data: payload.data ?? payload,
    icon: payload.icon ?? '/icon-192x192.svg',
    badge: payload.badge ?? '/icon-192x192.svg',
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url
  if (!targetUrl) {
    return
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const focusedClient = clients.find((client) => client.url === targetUrl)
      if (focusedClient) {
        return focusedClient.focus()
      }
      return self.clients.openWindow(targetUrl)
    }),
  )
})
