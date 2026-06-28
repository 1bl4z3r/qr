const CACHE_NAME = 'qr-studio-2.0';
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

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

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
    return; // Exit fetch handler for this request
  }

  // Standard Offline Caching (GET Requests)
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});