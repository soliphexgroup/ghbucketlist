import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
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
