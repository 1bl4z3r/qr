const CACHE_VERSION = "2026-06-03";
const CACHE_NAME = `qr-studio-${CACHE_VERSION}`;
const APP_SHELL = [
  "./", 
  "./index.html", 
  "./about.html", 
  "./404.html",
  "./manifest.webmanifest", 
  "./assets/styles.css", 
  "./assets/app.js",
  "./assets/icon.svg", 
  "./assets/icon-192.png", 
  "./assets/vendor/qr-code-styling.min.js", 
  "./assets/vendor/html5-qrcode.min.js"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL))
  );
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

  // 2. Stale-While-Revalidate with Strict Offline Fallback
  event.respondWith((async () => {
    try {
      // Check cache first. ignoreSearch ensures that URL parameters 
      // (like /?action=create) don't cause cache misses.
      const cachedResponse = await caches.match(event.request, { ignoreSearch: true });
      
      if (cachedResponse) {
        // Check if file is older than 1 week
        const dateHeader = cachedResponse.headers.get('date');
        let isStale = true;
        if (dateHeader) {
          const age = Date.now() - new Date(dateHeader).getTime();
          const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
          if (age < ONE_WEEK) isStale = false;
        }
        
        // Trigger background network revalidation if stale
        if (isStale) {
          event.waitUntil(
            fetch(event.request).then(networkResponse => {
              if (networkResponse && networkResponse.ok) {
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
              }
            }).catch(() => {
              // Silently fail the background fetch if the user is offline
              console.log('Background sync skipped: Device is offline.');
            })
          );
        }
        return cachedResponse;
      }
      
      // If not in cache, fetch from network
      const networkResponse = await fetch(event.request);
      if (networkResponse && networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
      
    } catch (error) {
      // 3. OFFLINE FALLBACK
      // A TypeError is thrown when the network fails completely (device offline)
      if (event.request.mode === 'navigate') {
        const cache = await caches.open(CACHE_NAME);
        // Serve the cached index page for any failed page navigations
        return cache.match('./index.html');
      }
      
      // Re-throw the error for non-navigation requests so the browser handles them
      throw error;
    }
  })());
});