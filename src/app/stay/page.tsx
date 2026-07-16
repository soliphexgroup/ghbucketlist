import type { Metadata } from "next";
import { Suspense } from "react";
import { StaySearchAndResults } from "@/components/stay/stay-search-and-results";

export const metadata: Metadata = {
  title: "Places to Stay",
  description: "Hotels, apartments, and vacation homes across Accra.",
};

export default function StayPage() {
  return (
    <Suspense fallback={null}>
      <StaySearchAndResults />
    </Suspense>
  );
}
