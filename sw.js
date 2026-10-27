// AstroPets – Service Worker (cache para uso offline)
// Sempre que alterar QUALQUER arquivo do jogo, aumente o número da versão abaixo,
// assim os aparelhos que já visitaram baixam a versão nova.
const VERSION = 'astropets-v2';

const ARQUIVOS = [
  './',
  './index.html',
  './missao.html',
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
  './icons/apple-touch-icon.png'
];

// Instala: baixa tudo de uma vez e guarda no aparelho
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(ARQUIVOS)).then(() => self.skipWaiting())
  );
});

// Ativa: apaga caches de versões antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Responde: primeiro o cache; se não tiver, tenta a rede
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
