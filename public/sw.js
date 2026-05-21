// Minimal service worker — enables PWA installability without intercepting requests.
// Next.js App Router handles all caching; we intentionally do nothing here.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// Empty fetch handler satisfies Chrome's PWA installability requirement.
// Returning without respondWith lets the browser handle requests normally.
self.addEventListener('fetch', () => {})
