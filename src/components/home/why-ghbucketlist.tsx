import { CalendarCheck, ShieldCheck, MapPinned, Headset } from "lucide-react";
import { Container } from "@/components/container";

const reasons = [
  {
    icon: CalendarCheck,
    title: "Instant booking confirmation",
    description: "Secure your spot in a few taps, with free cancellation on most listings.",
  },
  {
    icon: ShieldCheck,
    title: "Real reviews, real experiences",
    description: "Honest ratings from verified guests who've actually been there.",
  },
  {
    icon: MapPinned,
    title: "Curated across Ghana",
    description: "Handpicked stays, activities, rentals, and services in Accra and beyond.",
  },
  {
    icon: Headset,
    title: "Support you can trust",
    description: "Our team is here to help, whenever you need it.",
  },
];

export function WhyGHBucketlist() {
  return (
    <section className="py-10 sm:py-12">
      <Container className="max-w-[64rem] lg:px-6">
        <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Why GH Bucketlist?
        </h2>

        {/* Phones: a compact icon-left list. sm+ : the boxed grid (2-up, then 4-up on lg). */}
        <div className="mt-8 flex flex-col gap-5 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="flex items-start gap-4 sm:block sm:rounded-2xl sm:bg-muted sm:p-6"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <reason.icon className="size-5" />
              </span>
              <div className="sm:mt-4">
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {reason.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{reason.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
