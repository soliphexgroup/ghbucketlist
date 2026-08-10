import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Shop Merch" };

export default function ShopPage() {
  return (
    <ComingSoon
      title="GHBucketlist Merch"
      description="Our merch shop is coming soon."
    />
  );
}
