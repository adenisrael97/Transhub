// TransHub Service Worker
//
// Caching policy (product-driven — see CLAUDE.md "Caching policy"):
//   • Tickets are cached AGGRESSIVELY so a passenger can show a boarding pass
//     with ZERO signal at the terminal. This is the marquee PWA feature.
//   • Live inventory (trips/seat search) and anything money-related (bookings,
//     payments) are NEVER cached — stale data = double-booking.
//
// Strategy map:
//   PAGE  /tickets            → NetworkFirst        (cache: tickets-list)
//   PAGE  /tickets/:id        → StaleWhileRevalidate (cache: tickets-detail) ← instant offline, self-heals on deploy
//   API   GET /tickets        → StaleWhileRevalidate (cache: tickets-api)
//   API   GET /tickets/:id    → CacheFirst          (cache: tickets-api)     ← booking data never changes
//   ASSET /_next/* /icons/*   → CacheFirst          (cache: transhub-static) ← boots offline pages
//   PAGE  everything else     → NetworkFirst → offline fallback (NOT cached)
//   API   trips/bookings/payments + any non-GET → NetworkOnly (pass through)

const VERSION = 'v3';
const STATIC_CACHE = `transhub-static-${VERSION}`;
const PAGE_TICKET_LIST = 'tickets-list';
const PAGE_TICKET_DETAIL = 'tickets-detail';
const API_TICKETS = 'tickets-api';

// Caches the SW is allowed to keep. Anything else is purged on activate
// (this also clears the old broad `transhub-v1` cache-everything store).
const KNOWN_CACHES = [STATIC_CACHE, PAGE_TICKET_LIST, PAGE_TICKET_DETAIL, API_TICKETS];

// App-shell essentials only. Inventory pages (/search, /trips/*) are intentionally
// NOT precached — they must show the offline fallback, never stale seat data.
const PRECACHE = ['/', '/manifest.json'];

const TICKET_DETAIL_RE = /^\/tickets\/[^/]+$/;
const STATIC_ASSET_RE = /\.(?:js|css|woff2?|ttf|png|jpg|jpeg|svg|gif|ico|webp)$/;

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline · TransHub</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
font-family:system-ui,sans-serif;background:#F8FAFC;color:#0F172A}
.c{text-align:center;max-width:320px;padding:24px}h1{font-size:18px;margin:0 0 8px}
p{font-size:14px;color:#64748B;margin:0 0 20px}a{color:#2563EB;font-weight:600;text-decoration:none}</style>
</head><body><div class="c"><h1>You're offline</h1>
<p>This page needs a connection. Your purchased tickets stay available offline.</p>
<a href="/tickets">View My Tickets</a></div></body></html>`;

function offlineResponse() {
  return new Response(OFFLINE_HTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// --- Strategies ---------------------------------------------------------------

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request, { ignoreVary: true });
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(event, request, cacheName) {
  const cached = await caches.match(request, { ignoreVary: true });
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => null);
  // Keep the SW alive until the background refresh settles — otherwise the SW
  // can be terminated after we return the cached copy and the cache never updates.
  event.waitUntil(network);
  return cached || (await network) || offlineResponse();
}

// Non-ticket page navigations: try network; fall back to a precached shell if we
// have one, otherwise the offline page. Successful responses are NOT cached so
// inventory pages never serve stale.
async function navigationFallback(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match(request, { ignoreVary: true });
    return cached || offlineResponse();
  }
}

// --- Lifecycle ----------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // Resilient precache: one failed asset must not abort the whole install
      // (cache.addAll is atomic and would reject the install if any item 404s).
      Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (res.ok) await cache.put(url, res);
          } catch {
            /* ignore — runtime caching fills these in on first online visit */
          }
        })
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !KNOWN_CACHES.includes(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// --- Fetch routing ------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Mutations (bookings/payments POST/PATCH/DELETE) are never cached.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // --- Cross-origin = backend API ---
  if (!sameOrigin) {
    if (url.pathname === '/tickets') {
      event.respondWith(staleWhileRevalidate(event, request, API_TICKETS));
    } else if (TICKET_DETAIL_RE.test(url.pathname)) {
      event.respondWith(cacheFirst(request, API_TICKETS));
    }
    // Everything else (trips/search, trips/:id, bookings/*, payments/*, auth) →
    // NetworkOnly: do nothing, let the request hit the network uncached.
    return;
  }

  // --- Same-origin static build assets → CacheFirst (immutable, content-hashed) ---
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json' ||
    STATIC_ASSET_RE.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // --- Same-origin page navigations ---
  if (request.mode === 'navigate') {
    if (url.pathname === '/tickets') {
      event.respondWith(networkFirst(request, PAGE_TICKET_LIST));
    } else if (TICKET_DETAIL_RE.test(url.pathname)) {
      event.respondWith(staleWhileRevalidate(event, request, PAGE_TICKET_DETAIL));
    } else {
      event.respondWith(navigationFallback(request));
    }
    return;
  }

  // --- Other same-origin GETs (RSC payloads, etc.) → network, fall back to cache ---
  // Always resolve to a Response: respondWith(undefined) would surface a noisy
  // "not a Response" network error when offline with no cached copy.
  event.respondWith(
    fetch(request).catch(async () =>
      (await caches.match(request, { ignoreVary: true })) ||
      new Response(null, { status: 504, statusText: 'Offline' })
    )
  );
});
