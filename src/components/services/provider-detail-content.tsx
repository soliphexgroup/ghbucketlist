"use client";

import { useState } from "react";
import Image from "next/image";
import { BadgeCheck, Clock, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WishlistButton } from "@/components/wishlist-button";
import { ServiceRequestDialog } from "@/components/services/service-request-dialog";
import { formatGHS } from "@/lib/format";
import type { ServiceProvider } from "@/lib/service-types";

export function ProviderDetailContent({ provider }: { provider: ServiceProvider }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-10">
        <div className="flex items-center gap-4">
          <Image
            src={provider.avatarUrl}
            alt={provider.name}
            width={64}
            height={64}
            className="size-16 rounded-full object-cover"
          />
          <div>
            <p className="text-sm text-muted-foreground">{provider.yearsExperience} years experience</p>
            <p className="text-sm text-muted-foreground">{provider.completedJobs} jobs completed</p>
          </div>
          {provider.verified && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <BadgeCheck className="size-4" />
              Verified
            </span>
          )}
        </div>

        <Separator />

        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">About</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{provider.bio}</p>
        </section>

        <Separator />

        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">Skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {provider.skills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground"
              >
                <Wrench className="size-3.5" />
                {skill}
              </span>
            ))}
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">Recent work</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {provider.portfolioImages.map((src) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-xl">
                <Image src={src} alt={`${provider.name} portfolio`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="font-heading text-xl font-semibold text-foreground">Service area</h2>
          <p className="mt-2 text-muted-foreground">
            {provider.serviceArea}, {provider.city}
          </p>
        </section>
      </div>

      <div>
        <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
          <div className="flex items-baseline justify-between">
            <p className="font-heading text-2xl font-bold text-foreground">
              {formatGHS(provider.hourlyRate)}
              <span className="text-sm font-normal text-muted-foreground"> / hour</span>
            </p>
            <WishlistButton experienceId={provider.id} className="static bg-secondary hover:bg-secondary" />
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" />
            Typically responds in ~{provider.responseTimeMinutes} minutes
          </p>

          <Button
            size="lg"
            onClick={() => setDialogOpen(true)}
            className="mt-5 w-full"
          >
            Request Service
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            You won&apos;t be charged yet — {provider.name} will confirm and quote a price first.
          </p>
        </div>

        <ServiceRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} provider={provider} />
      </div>
    </div>
  );
}
