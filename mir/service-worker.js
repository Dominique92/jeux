// Create/install cache
self.addEventListener('install', evt => {
  // Last file date will trigger the cache reload
  console.log('PWA install');

  self.skipWaiting(); // Immediately activate the SW & trigger controllerchange

  const cacheName = 'mirrorsCache';

  caches.delete(cacheName)
    .then(console.log('PWA ' + cacheName + ' deleted'))
    .catch(error => console.error(error));

  evt.waitUntil(
    caches.open(cacheName)
    .then(cache => {
      console.log('PWA open cache ' + cacheName);
      cache.addAll([
          'favicon.svg',
          'index.html',
          'index.css',
          'index.js',
          'manifest.json',
          'service-worker.js',
          'boxes.svg',
        ])
        .then(console.log('PWA files added to cache'))
        .catch(error => console.error(error));
    })
    .catch(error => console.error(error))
  );
});

// Serves required files
// Cache first, then browser cache, then network
self.addEventListener('fetch', evt => {
  //console.log('PWA fetch ' + evt.request.url);
  evt.respondWith(
    caches.match(evt.request)
    .then(found => found || fetch(evt.request))
    .catch(error => console.error(error + ' ' + evt.request.url))
  )
});