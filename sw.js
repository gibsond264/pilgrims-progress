const CACHE = 'pilgrims-progress-v1';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './chapters.js',
  './manifest.json',
  './images/Cover.png',
  './images/Chapter1.png',
  './images/Chapter2.png',
  './images/Chapter3.png',
  './images/Chapter4.png',
  './images/Chapter5.png',
  './images/Chapter6.png',
  './images/Chapter7.png',
  './images/Chapter8.png',
  './images/Chapter9.png',
  './images/Chapter10.png',
  './images/Chapter11.png',
  './images/Chapter12.png',
  './images/Chapter13.png',
  './images/Chapter14.png',
  './images/Chapter15.png',
  './images/Chapter16.png',
  './images/Chapter17.png'
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
