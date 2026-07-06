import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Community Guidelines" };

export default function GuidelinesPage() {
  return (
    <ComingSoon
      title="Community Guidelines"
      description="Our full guidelines for guests and hosts are coming soon."
    />
  );
}
