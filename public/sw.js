// GHBucketlist Rewards POS — offline service worker.
// Deliberately narrow: it makes ONLY the /rewards/pos counter page work offline (network-first for
// the page, cache-first for the immutable Next assets it needs). Every other route and all data
// requests (Supabase / Paystack / RSC) pass straight through to the network, so the rest of the site
// is untouched. Bump VERSION on any change here to force clients onto the new caches.

const VERSION = "ghb-pos-v2";
const ASSET_CACHE = `${VERSION}-assets`;
const PAGE_CACHE = `${VERSION}-pages`;
const POS_KEY = "/rewards/pos"; // one cache key for the shell, regardless of the ?t= token

self.addEventListener("install", (event) => {
  // Precache the shell + manifest + icons up front. A service worker does NOT control the page load
  // that registered it, so without this the very first (online) launch would never cache the HTML —
  // and the app couldn't open offline afterwards.
  event.waitUntil(
    (async () => {
      const assets = await caches.open(ASSET_CACHE);
      try {
        // Fetch the shell, cache it, then precache every /_next/static asset it references so the
        // page fully boots offline (not just a blank HTML document).
        const res = await fetch(new Request(POS_KEY, { cache: "reload" }));
        if (res.ok) {
          const pages = await caches.open(PAGE_CACHE);
          await pages.put(POS_KEY, res.clone());
          const html = await res.text();
          const refs = [...new Set((html.match(/\/_next\/static\/[^"']+/g) || []))];
          await Promise.allSettled(refs.map((u) => assets.add(u)));
        }
      } catch {
        /* offline during install — runtime caching fills in on the next online load */
      }
      try {
        await assets.addAll([
          "/manifest.webmanifest",
          "/icons/ghb-192.png",
          "/icons/ghb-512.png",
          "/icons/ghb-maskable-512.png",
        ]);
      } catch {
        /* ignore — filled in at runtime */
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase/Paystack/etc. — never intercept.

  // The POS page itself: try network, fall back to the cached shell when offline. Cached under a
  // token-agnostic key because the token is read client-side (the HTML is identical for any partner).
  if (req.mode === "navigate") {
    if (url.pathname === "/rewards/pos" || url.pathname.startsWith("/rewards/pos/")) {
      event.respondWith(pageNetworkFirst(req));
    }
    return; // other navigations: default network behaviour, no caching.
  }

  // Immutable, hashed assets the POS shell needs — cache-first so they're there offline.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(req));
  }
  // Anything else falls through to the network.
});

async function pageNetworkFirst(req) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) await cache.put(POS_KEY, res.clone());
    return res;
  } catch {
    const cached = await cache.match(POS_KEY);
    return cached || Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) await cache.put(req, res.clone());
    return res;
  } catch {
    return cached || Response.error();
  }
}
