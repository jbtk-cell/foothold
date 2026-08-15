/**
 * Offline support.
 *
 * The promise on the front page is that the course keeps working when the
 * network does not - a school laptop on bad wifi, a bus, a country where the
 * CDN is blocked. That promise is kept here.
 *
 * Strategy, by kind of request:
 *   app shell and lessons   stale-while-revalidate, so a returning learner
 *                           gets an instant page and a fresh copy next time
 *   the Pyodide runtime     cache-first and never revalidated, because it is
 *                           large, versioned in its URL, and immutable
 *
 * Bump CACHE_VERSION when the app shell changes; old caches are deleted on
 * activate so a stale build cannot outlive a deploy.
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `foothold-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `foothold-python-${CACHE_VERSION}`;

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/favicon.svg',
  './css/app.css',
  './js/app.js',
  './js/editor.js',
  './js/highlight.js',
  './js/lesson.js',
  './js/markdown.js',
  './js/runtime.js',
  './js/state.js',
  './js/worker.js',
  './js/ui/certificate.js',
  './js/ui/home.js',
  './js/ui/lesson-view.js',
  './js/ui/sidebar.js',
  './js/ui/terminal.js',
  './py/harness.py',
  './py/console.py',
  './content/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll fails as a unit if any single file 404s, which would leave the
      // learner with no offline copy at all. Failing per-file is kinder.
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('foothold-') && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isPythonRuntime(url) {
  return url.includes('/pyodide/') || url.endsWith('.wasm') || url.endsWith('.zip');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = request.url;

  if (isPythonRuntime(url)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  if (!url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const hit = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => hit);

      return hit || network;
    }),
  );
});
