import type { NextConfig } from "next";

// The Supabase Storage host (where host-uploaded photos live) is derived from the public env var,
// so the image optimizer accepts it in whatever environment builds. Falls back to a wildcard.
const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    // The optimizer is ON (this app runs as a Node server — see DEPLOY-HOSTINGER.md — which
    // supports it). It resizes per-viewport and serves AVIF/WebP, so a host's 2MB photo becomes
    // a ~100–200KB thumbnail. Only images from these hosts are optimized; host uploads live on
    // Supabase Storage, and the "paste a URL" field is restricted to these hosts (see listing-images.ts).
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      // Supabase Storage (host-uploaded photos). The known project host, plus the env-derived one
      // so a different Supabase project (staging) also works without editing this file.
      { protocol: "https", hostname: "cakyikgtjjhxsfvuhdmf.supabase.co" },
      ...(supabaseHost && supabaseHost !== "cakyikgtjjhxsfvuhdmf.supabase.co"
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : []),
    ],
    // Cache the optimized variants on the server for 31 days (source URLs are content-addressed).
    minimumCacheTTL: 2678400,
  },
  // The service worker and the per-partner manifest MUST NOT be cached by the CDN — the browser
  // relies on fetching the current bytes to detect updates. A cached sw.js silently blocks every
  // PWA update (the whole point of the offline counter app).
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
      {
        source: "/api/pos-manifest",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
      // Hashed build assets are content-addressed and immutable — cache them hard.
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // HTML page routes (no file extension) MUST NOT be cached by the CDN. Otherwise a stale cached
      // page keeps referencing chunk hashes from a previous build (which 404), and the site renders
      // unstyled. Excludes /_next/, /api/, and any path with a file extension (assets).
      {
        source: "/((?!_next/|api/|.*\\.).*)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
