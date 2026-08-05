import type { Metadata } from "next";
import { Suspense } from "react";
import { StayLanding } from "@/components/stay/stay-landing";

export const metadata: Metadata = {
  title: "Places to Stay",
  description: "Hotels, apartments, and vacation homes across Accra.",
};

export default function StayPage() {
  return (
    <Suspense fallback={null}>
      <StayLanding />
    </Suspense>
  );
}
