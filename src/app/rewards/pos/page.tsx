import type { Metadata } from "next";
import { PosApp } from "@/components/rewards/pos-app";

// Server component so we can emit a per-partner manifest link (with the device token) into <head>.
// The installed app then launches at /rewards/pos?t=<token>, so the home-screen icon always opens
// the right partner — it doesn't depend on browser storage surviving into the installed app.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}): Promise<Metadata> {
  const { t } = await searchParams;
  return {
    title: "GHBucketlist Rewards",
    manifest: t ? `/api/pos-manifest?t=${encodeURIComponent(t)}` : "/manifest.webmanifest",
  };
}

export default function BrPosPage() {
  return <PosApp />;
}
