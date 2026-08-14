import { NextResponse } from "next/server";

// Per-partner PWA manifest. The counter page links to this with its ?t=<token>, so the INSTALLED
// app's start_url carries the token — the home-screen icon always opens the right partner's device,
// without depending on localStorage surviving the browser → installed-app boundary (which it doesn't
// on iOS). Served fresh (no-store) so each partner's install gets its own start_url.
export function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const startUrl = token ? `/rewards/pos?t=${encodeURIComponent(token)}` : "/rewards/pos";

  const manifest = {
    name: "GHBucketlist Rewards",
    short_name: "GHB Rewards",
    description: "Redeem Bucket Rewards at the counter — works offline.",
    start_url: startUrl,
    scope: "/rewards/pos",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icons/ghb-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/ghb-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/ghb-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" },
  });
}
