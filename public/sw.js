// GHBucketlist Rewards POS — offline service worker.
// Deliberately narrow: it makes ONLY the /rewards/pos counter page work offline (network-first for
// the page, cache-first for the immutable Next assets it needs). Every other route and all data
// requests (Supabase / Paystack / RSC) pass straight through to the network, so the rest of the site
// is untouched. Bump VERSION on any change here to force clients onto the new caches.

const VERSION = "ghb-pos-v3";
const ASSET_CACHE = `${VERSION}-assets`;
const PAGE_CACHE = `${VERSION}-pages`;
const TOKEN_CACHE = "ghb-pos-token"; // version-INDEPENDENT: survives SW updates
const TOKEN_KEY = "/__pos_token";
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
      // Drop old versioned caches, but keep the token store (not version-scoped).
      await Promise.all(
        keys.filter((k) => k !== TOKEN_CACHE && !k.startsWith(VERSION)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase/Paystack/etc. — never intercept.

  // The POS page. Remember the token when present; if a launch arrives WITHOUT one (e.g. an installed
  // shortcut whose start_url lost the token), redirect to the remembered token so it self-heals.
  // Offline, fall back to the cached shell.
  if (req.mode === "navigate") {
    if (url.pathname === "/rewards/pos" || url.pathname.startsWith("/rewards/pos/")) {
      event.respondWith(handlePosNavigation(req, url));
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

async function storeToken(token) {
  try {
    const cache = await caches.open(TOKEN_CACHE);
    await cache.put(TOKEN_KEY, new Response(token));
  } catch {
    /* ignore */
  }
}

async function getStoredToken() {
  try {
    const cache = await caches.open(TOKEN_CACHE);
    const res = await cache.match(TOKEN_KEY);
    return res ? await res.text() : null;
  } catch {
    return null;
  }
}

async function handlePosNavigation(req, url) {
  const token = url.searchParams.get("t");
  if (token) {
    await storeToken(token); // remember it for future token-less launches
    return pageNetworkFirst(req);
  }
  // No token in this launch — recover the last one we saw and redirect so the page gets it.
  const saved = await getStoredToken();
  if (saved) {
    return Response.redirect(`/rewards/pos?t=${encodeURIComponent(saved)}`, 302);
  }
  return pageNetworkFirst(req); // never seen a token — show the "device not set up" screen.
}

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
