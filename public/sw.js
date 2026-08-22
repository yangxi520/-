// One-time cleanup worker for installations that still have the former
// Workbox service worker. This worker never intercepts requests.
globalThis.addEventListener('install', (event) => {
  event.waitUntil(globalThis.skipWaiting());
});

globalThis.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await globalThis.caches.keys();
    await Promise.all(cacheNames.map((cacheName) => globalThis.caches.delete(cacheName)));
    await globalThis.registration.unregister();

    const windows = await globalThis.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    await Promise.all(windows.map((client) => client.navigate(client.url)));
  })());
});
