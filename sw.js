const CACHE_NAME = 'medspasync-demo-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './demo.html',
  './favicon.png',
  './tailwind.css',
  './preview.js',
  './usageMeter.js',
  './demo.js',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://fonts.gstatic.com/s/inter/v13/UcCJ3Fwrkov4l52xAaQGCas6WQ.woff2',
  'https://fonts.gstatic.com/s/inter/v13/UcCJ3Fwrkov4l52xY6bGCA.woff2',
  'https://fonts.gstatic.com/s/inter/v13/UcCJ3Fwrkov4l52xCaEHK4kY.woff2',
  'https://fonts.gstatic.com/s/inter/v13/UcCJ3Fwrkov4l52xI6YHK4kY.woff2',
  'https://fonts.gstatic.com/s/inter/v13/UcCJ3Fwrkov4l52xY6bGCA.woff2',
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
    .then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}