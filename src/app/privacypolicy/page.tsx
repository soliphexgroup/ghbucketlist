import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <ComingSoon
      title="Privacy Policy"
      description="Our full privacy policy is coming soon."
    />
  );
}
