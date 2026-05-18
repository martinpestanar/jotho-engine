// Oracle War Room — Service Worker v1.0
// Cache-first strategy for static assets, network-first for API calls

const CACHE_NAME = 'oracle-v1'
const STATIC_ASSETS = [
  '/oracle',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Install: pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Could not cache some assets:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch strategy:
// - Supabase API / auth → always network
// - Everything else → cache-first with network fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET, local development, and Supabase API calls
  if (event.request.method !== 'GET') return
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase') || url.port === '54321') return
  if (url.pathname.startsWith('/api/')) return
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      return fetch(event.request).then((response) => {
        // Only cache successful same-origin responses
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic' &&
          !url.pathname.includes('_next/static/chunks')
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/oracle')
        }
      })
    })
  )
})
