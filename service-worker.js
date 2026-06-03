const CACHE_VERSION = "2026-05-28-v2";
const CACHE_NAME = `qr-studio-${CACHE_VERSION}`;
const APP_SHELL = [
  "./", "./index.html", "./about.html", "./404.html",
  "./manifest.webmanifest", "./assets/styles.css", "./assets/app.js",
  "./assets/icon.svg", "./assets/icon-192.png",
  "./assets/vendor/qr-code-styling.min.js", "./assets/vendor/html5-qrcode.min.js"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL)));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => k === CACHE_NAME ? Promise.resolve() : caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // 1. Intercept Share Target Image Uploads
  if (event.request.method === 'POST' && event.request.url.includes('?action=shared-image')) {
    event.respondWith((async () => {
      const formData = await event.request.formData();
      const file = formData.get('image');

      // Store the image temporarily in a specific cache so app.js can pick it up
      const cache = await caches.open('shared-image-cache');
      await cache.put(new Request('/shared-image-temp'), new Response(file));

      // Redirect to the scanner section natively
      return Response.redirect('/?action=scan&shared=true', 303);
    })());
    return;
  }

  if (event.request.method !== 'GET') return;

  // 2. Stale-While-Revalidate with 1-Week Check
  event.respondWith((async () => {
    const cachedResponse = await caches.match(event.request);

    if (cachedResponse) {
      // Check if file is older than 1 week
      const dateHeader = cachedResponse.headers.get('date');
      let isStale = true;
      if (dateHeader) {
        const age = Date.now() - new Date(dateHeader).getTime();
        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
        if (age < ONE_WEEK) isStale = false;
      }

      if (isStale) {
        // Trigger background network revalidation
        event.waitUntil(
          fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
            }
          }).catch(e => console.log('Network offline, using stale cache.'))
        );
      }
      return cachedResponse;
    }

    // No cache, fetch from network
    return fetch(event.request).then(networkResponse => {
      const clonedResponse = networkResponse.clone();
      event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse))
      );
      return networkResponse;
    }).catch(() => {
      if (event.request.mode === 'navigate') return caches.match('./index.html');
    });
  })());
});