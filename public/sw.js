// Documentary Club service worker: makes the site installable and keeps it usable on a bad connection.
// Pages always come from the network first, so a publish is seen at once; the cached copy is only
// an offline fallback. Hashed build files, posters and icons are cached as they're fetched.
// Server functions (live providers, newsletter, feedback) and other sites are never touched.
const PAGES = 'pages-v1';
const FILES = 'files-v1';
const MAX_PAGES = 50;
const MAX_FILES = 400;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== FILES).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

async function page(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES);
      await cache.put(request, response.clone());
      trim(PAGES, MAX_PAGES);
    }
    return response;
  } catch {
    return (await caches.match(request)) ?? (await caches.match('/')) ?? Response.error();
  }
}

async function file(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(FILES);
    await cache.put(request, response.clone());
    trim(FILES, MAX_FILES);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/_serverFn')) return;
  if (request.mode === 'navigate') event.respondWith(page(request));
  else if (/^\/(assets|posters|og)\//.test(url.pathname) || /\.(png|svg|jpg|webp|woff2?)$/.test(url.pathname)) event.respondWith(file(request));
});
