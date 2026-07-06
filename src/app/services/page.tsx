import type { Metadata } from "next";
import { ServiceBrowser } from "@/components/services/service-browser";

export const metadata: Metadata = {
  title: "Handyman Services",
  description: "Trusted local carpenters, electricians, plumbers, cleaners, and welders across Accra.",
};

export default function ServicesPage() {
  return <ServiceBrowser />;
}
