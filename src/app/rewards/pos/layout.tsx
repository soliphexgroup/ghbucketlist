import type { Metadata, Viewport } from "next";

// Scopes the PWA manifest + install metadata to the counter page only (not the whole site), so the
// "install / add to home screen" affordance shows up here and the installed app opens the POS.
export const metadata: Metadata = {
  title: "GHBucketlist Rewards",
  // The manifest link is NOT declared here — the counter page injects a per-partner one
  // (/api/pos-manifest?t=<token>) at runtime so the installed app's start_url carries the token.
  // Letting Next manage the manifest link would revert that client-side change.
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "GHB Rewards" },
};

export const viewport: Viewport = { themeColor: "#000000" };

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
