import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Careers" };

export default function CareersPage() {
  return (
    <ComingSoon
      title="Careers at GH Bucketlist"
      description="No open roles right now — check back soon or follow us on social media for updates."
    />
  );
}
