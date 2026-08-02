import type { Metadata } from "next";
import { Container } from "@/components/container";
import { BrSignupForm } from "@/components/rewards/br-signup-form";
import { BrPartnerDirectory } from "@/components/rewards/br-partner-directory";

export const metadata: Metadata = {
  title: "Bucket Rewards",
  description:
    "Bucket Rewards (BR) — powered by GH Bucketlist. Join free and get exclusive discounts at partner restaurants, salons, spas and more across Ghana.",
};

export default function RewardsPage() {
  return (
    <div>
      <section className="bg-[linear-gradient(135deg,var(--brand-primary-gradient-from),var(--brand-primary-gradient-to))] py-14 text-primary-foreground sm:py-20">
        <Container>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/80">
            BR — powered by GH Bucketlist
          </p>
          <h1 className="mt-2 max-w-2xl font-heading text-3xl font-bold sm:text-4xl">
            Bucket Rewards: real discounts at your favourite local spots
          </h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/90">
            Ghana&apos;s lifestyle rewards network. Join free, then just ask for your BR discount at
            partner restaurants, fast-food spots, salons and spas — give your phone number and save.
            No app, no card, no subscription.
          </p>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[360px_1fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <BrSignupForm />
            <div className="mt-4 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How it works</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>Join with your phone number (once).</li>
                <li>At a partner, ask for your Bucket Rewards discount.</li>
                <li>Give your number — the discount is applied on the spot.</li>
              </ol>
            </div>
          </div>
          <BrPartnerDirectory />
        </div>
      </Container>
    </div>
  );
}
