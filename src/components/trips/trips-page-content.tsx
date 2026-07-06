"use client";

import { useState } from "react";
import { Compass, MessageCircle, Wallet } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { TripTierCard } from "@/components/trips/trip-tier-card";
import { TripInquiryDialog } from "@/components/trips/trip-inquiry-dialog";
import { useTripTiers } from "@/lib/trip-pricing-store";
import type { TripTier } from "@/lib/trip-inquiries-store";

const paymentTerms = [
  {
    icon: Wallet,
    title: "Initial Deposit",
    description: "50% of the service fee to begin designing your itinerary.",
  },
  {
    icon: Wallet,
    title: "Balance Payment",
    description: "The remaining 50% is due on final delivery or before your trip starts.",
  },
  {
    icon: Compass,
    title: "What's Covered",
    description:
      "Planning & coordination only. Travellers pay for accommodation, meals, and transport directly.",
  },
];

const steps = [
  {
    title: "Consultation",
    description: "Share your travel dates, interests, and preferences with our team.",
  },
  {
    title: "Planning & Design",
    description: "We build a curated, personalized itinerary tailored to you.",
  },
  {
    title: "Booking & Support",
    description: "Tier-dependent booking coordination and on-ground support throughout your trip.",
  },
];

export function TripsPageContent() {
  const tiers = useTripTiers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TripTier>("standard");

  function openInquiry(tier: TripTier) {
    setSelectedTier(tier);
    setDialogOpen(true);
  }

  return (
    <div>
      <section className="bg-secondary/40 py-16 text-center sm:py-20">
        <Container>
          <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Curated Experiences in Ghana
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Experience personalized travel planning with three service tiers.
          </p>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <TripTierCard key={tier.id} tier={tier} onGetStarted={() => openInquiry(tier.id)} />
          ))}
        </div>

        <div className="mt-16">
          <h2 className="text-center font-heading text-2xl font-bold text-foreground">
            Payment Terms
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {paymentTerms.map((term) => (
              <div key={term.title} className="rounded-2xl border border-border p-5">
                <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
                  <term.icon className="size-5" />
                </span>
                <p className="mt-3 font-medium text-foreground">{term.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{term.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-center font-heading text-2xl font-bold text-foreground">
            How It Works
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="font-heading text-lg font-bold">{i + 1}</span>
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center rounded-2xl bg-[linear-gradient(135deg,var(--brand-primary-gradient-from),var(--brand-primary-gradient-to))] py-12 text-center text-primary-foreground">
          <MessageCircle className="size-8" />
          <h2 className="mt-4 font-heading text-2xl font-bold">Ready to Plan Your Perfect Trip?</h2>
          <p className="mt-2 max-w-md text-primary-foreground/80">
            Tell us where you want to go, and we&apos;ll take it from there.
          </p>
          <Button
            size="lg"
            variant="outline"
            className="mt-6 border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => openInquiry("standard")}
          >
            Get Started Today
          </Button>
        </div>
      </Container>

      <TripInquiryDialog
        key={selectedTier}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tiers={tiers}
        defaultTier={selectedTier}
      />
    </div>
  );
}
