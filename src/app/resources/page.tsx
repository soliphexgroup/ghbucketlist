import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Host Resources" };

export default function ResourcesPage() {
  return (
    <ComingSoon
      title="Host Resources"
      description="Best practices and hosting tips are coming soon."
    />
  );
}
