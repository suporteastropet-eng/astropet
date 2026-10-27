// AstroPets – Service Worker (cache para uso offline)
const VERSION = 'astropets-v13';

const ARQUIVOS = [
  './',
  './index.html',
  './missao.html',
  './missao.css',       // ← NOVO
  './missao.js',        // ← NOVO
  './manifest.json',
  './luna.png',
  './Bolt.png',
  './mimi.png',
  './tiko.png',
  './pet-extra.png',
  './tiko_puzzle_image.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './fonts/Poppins-Regular.woff2',
  './fonts/Poppins-SemiBold.woff2',
  './fonts/Poppins-Bold.woff2',
  './sons/acerto.mp3',
  './sons/erro.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(ARQUIVOS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((emCache) => {
      if (emCache) return emCache;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
