import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Hosting" };

export default function HostingPage() {
  return (
    <ComingSoon
      title="Turn your passion into extraordinary experiences"
      description="The full hosting overview — pricing, requirements, and host stories — is coming soon. In the meantime, explore what's already live on GH Bucketlist."
    />
  );
}
