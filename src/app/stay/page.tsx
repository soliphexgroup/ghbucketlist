import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseByPropertyType } from "@/components/stay/browse-by-property-type";
import { StayBrowser } from "@/components/stay/stay-browser";

export const metadata: Metadata = {
  title: "Places to Stay",
  description: "Hotels, apartments, and vacation homes across Accra.",
};

export default function StayPage() {
  return (
    <>
      <BrowseByPropertyType />
      <Suspense fallback={null}>
        <StayBrowser />
      </Suspense>
    </>
  );
}
