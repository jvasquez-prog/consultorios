const CACHE = 'pediconsultorios-v3';
const STATIC = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Red primero: siempre trae la versión más nueva del archivo cuando hay
// conexión (crítico durante desarrollo activo), y sólo usa el caché como
// respaldo si no hay red — antes era "caché primero" y podía quedar sirviendo
// una versión vieja de la app indefinidamente aunque el archivo cambiara.
self.addEventListener('fetch', e => {
  if (e.request.url.includes('airtable.com')) return;
  if (e.request.url.includes('fonts.googleapis.com')) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
