const CACHE = 'neptune-projets-front-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './styles/base.css',
  './styles/timeline.css',
  './styles/panels.css',
  './styles/responsive.css',
  './styles/utility.css',
  './styles/compact.css',
  './app.js',
  './app/core.js',
  './app/timeline.js',
  './app/project.js',
  './app/ai-parse.js',
  './app/ai-ui.js',
  './app/main.js',
  './data.js',
  './manifest.webmanifest',
  './assets/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
