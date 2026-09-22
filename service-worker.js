const CACHE_NAME = 'qr-studio-3.0';
const SHARED_IMAGE_CACHE = 'qr-shared-image-cache';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './site.webmanifest',
  'https://unpkg.com/html5-qrcode',
  'https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0'
];

// 1. INSTALL: Cache assets without forcing skipWaiting automatically
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// 2. ACTIVATE: Purge stale caches when a new version takes over
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== SHARED_IMAGE_CACHE) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => clients.claim())
  );
});

// 3. MESSAGE LISTENER: Take control only when user clicks "Update"
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// 4. FETCH: Intercept Share Target and serve cached assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // INTERCEPT: Web Share Target POST Request
  if (event.request.method === 'POST' && url.searchParams.get('action') === 'shared-scan') {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const file = formData.get('qr_image');

        // Save the file to a temporary cache so the frontend can retrieve it
        const cache = await caches.open(SHARED_IMAGE_CACHE);
        await cache.put(new Request('/shared-image-temp'), new Response(file));

        // Redirect to the app as a standard GET request to prevent static server crashes
        return Response.redirect('/index.html?action=scan&shared_file=true', 303);
      } catch (err) {
        return Response.redirect('/index.html?action=scan&error=share_failed', 303);
      }
    })());
    return;
  }

  // Standard Offline Caching (GET Requests)
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
