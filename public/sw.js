/**
 * LegacyPlanning — Service Worker mínimo.
 *
 * Esse SW garante "instalabilidade" no Chrome (que exige SW com handler de
 * fetch + manifest válido + HTTPS) e oferece um app-shell offline simples:
 * uma página de fallback quando a rede falha em navegações.
 *
 * Estratégia:
 *  - Pré-cache: app-shell mínimo (/, /offline, ícones).
 *  - Runtime: cache-first pra estáticos do /_next/static e /brand;
 *    network-first com fallback pra cache em navegações.
 *  - API: sempre passa pela rede (POST e dados sensíveis nunca cacheados).
 */

const VERSION = "v1"
const APP_SHELL = `lp-shell-${VERSION}`
const STATIC = `lp-static-${VERSION}`

const SHELL_URLS = [
  "/",
  "/offline",
  "/brand/legacy-mark.png",
  "/brand/pwa-192.png",
  "/brand/pwa-512.png",
  "/manifest.json",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL)
      .then((cache) => cache.addAll(SHELL_URLS).catch(() => {})),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== APP_SHELL && k !== STATIC)
          .map((k) => caches.delete(k)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)

  // Nunca interceptar chamadas de API (Gemini, AssemblyAI proxy, Firebase, etc.)
  if (url.pathname.startsWith("/api/")) return

  // Estáticos do Next + assets de marca → cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(STATIC).then((c) => c.put(request, copy))
            }
            return response
          }),
      ),
    )
    return
  }

  // Navegações → network-first com fallback pra cache → /offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(APP_SHELL).then((c) => c.put(request, copy))
          return response
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline")),
        ),
    )
  }
})
