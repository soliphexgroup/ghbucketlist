import type { Metadata } from "next";
import { StayBrowser } from "@/components/stay/stay-browser";

export const metadata: Metadata = {
  title: "Places to Stay",
  description: "Hotels, apartments, and vacation homes across Accra.",
};

export default function StayPage() {
  return <StayBrowser />;
}
