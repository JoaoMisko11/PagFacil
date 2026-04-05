const CACHE_NAME = "pagafacil-v3"

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  if (event.request.url.includes("/api/")) return
  // Nunca cacheia navegação (HTML) para evitar redirect loops
  if (event.request.mode === "navigate") return

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})

// Web Push: exibe notificação
self.addEventListener("push", (event) => {
  if (!event.data) return

  const data = event.data.json()
  const title = data.title || "PagaFácil"
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "pagafacil-reminder",
    data: {
      url: data.url || "/",
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Click na notificação: abre o app
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = event.notification.data?.url || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
