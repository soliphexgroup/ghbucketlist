import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <ComingSoon
      title="Terms & Conditions"
      description="Our full legal terms are coming soon."
    />
  );
}
