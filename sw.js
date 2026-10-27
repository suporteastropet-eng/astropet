// AstroPets – Service Worker (cache para uso offline)
const VERSION = 'astropets-v27';

const ARQUIVOS = [
  './',
  './index.html',
  './missao.html',
  './missao.css',
  './missao.js',
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

// INSTALL: baixa cada arquivo individualmente com try/catch.
// Se um arquivo falhar (404, rede caiu), os outros continuam sendo cacheados.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then(async (cache) => {
      for (const arquivo of ARQUIVOS) {
        try {
          await cache.add(arquivo);
        } catch (e) {
          console.warn('[SW] Falhou ao cachear:', arquivo, e);
        }
      }
      // Ativa imediatamente sem esperar o usuário fechar todas as abas
      await self.skipWaiting();
    })
  );
});

// ACTIVATE: apaga caches antigos e assume o controle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(
        nomes
          .filter((nome) => nome !== VERSION)
          .map((nome) => caches.delete(nome))
      ))
      .then(() => self.clients.claim())
  );
});

// FETCH: responde do cache primeiro; se não tiver, tenta a rede.
// Se a rede falhar e for navegação, cai no index.html (SPA fallback).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((emCache) => {
      if (emCache) return emCache;

      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
