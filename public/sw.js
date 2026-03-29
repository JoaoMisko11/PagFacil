const CACHE_NAME = "pagafacil-v2"

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
