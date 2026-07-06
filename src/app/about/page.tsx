import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <ComingSoon
      title="Connecting Communities Through Shared Experiences"
      description="Our story, mission, and values page is coming soon."
    />
  );
}
