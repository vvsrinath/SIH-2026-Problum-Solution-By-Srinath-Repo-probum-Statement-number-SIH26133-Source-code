/// <reference lib="webworker" />

const CACHE_NAME = 'swasthya-v2';
const API_CACHE = 'swasthya-api-v1';

// Base-aware paths: `${BASE}` is '/REPO/' on GitHub Pages, '/' elsewhere.
const BASE = self.registration.scope;

const STATIC_ASSETS = [
  BASE,
  `${BASE}index.html`,
  `${BASE}manifest.webmanifest`,
  `${BASE}images/gov/emblem-of-india.svg`,
  `${BASE}images/gov/flag-of-india.svg`,
  `${BASE}images/gov/ashoka-chakra.svg`,
  `${BASE}images/gov/ayushman-bharat.svg`,
  `${BASE}images/gov/isro.svg`,
];

self.addEventListener('install', (event) => {
  event.waitUntil?.(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil
    ?.(
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((k) => k !== CACHE_NAME && k !== API_CACHE)
              .map((k) => caches.delete(k)),
          ),
        ),
    )
    .then(() => self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle same-origin requests; let the browser handle all others.
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // HTML documents: always try the network first so updates land, fall back to cache.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNav(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Unavailable' });
  }
}

async function networkFirstNav(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const fallback = await caches.match(`${BASE}index.html`);
    if (fallback) return fallback;
    return new Response('Offline', { status: 503, statusText: 'Unavailable' });
  }
}

async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline', data: null }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
