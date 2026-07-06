import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Become a Host" };

export default function HostPage() {
  return (
    <ComingSoon
      title="Become a Host"
      description="The multi-step listing wizard is coming soon. Reach out via the Help Center if you'd like early access to hosting."
    />
  );
}
