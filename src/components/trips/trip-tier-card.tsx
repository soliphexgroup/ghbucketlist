import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TripTierInfo } from "@/data/trip-tiers";

export function TripTierCard({
  tier,
  onGetStarted,
}: {
  tier: TripTierInfo;
  onGetStarted: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-6",
        tier.popular ? "border-primary shadow-[0_8px_24px_rgba(0,0,0,0.1)]" : "border-border"
      )}
    >
      {tier.popular && (
        <span className="mb-3 w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          Most Popular
        </span>
      )}
      <h3 className="font-heading text-lg font-semibold text-foreground">{tier.name}</h3>
      <p className="mt-2">
        <span className="font-heading text-3xl font-bold text-foreground">${tier.price}</span>
        <span className="text-sm text-muted-foreground"> one-time fee</span>
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {tier.inclusions.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-success" />
            {item}
          </li>
        ))}
      </ul>

      <Button
        onClick={onGetStarted}
        className={cn("mt-6 w-full", tier.popular ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}
      >
        Get Started
      </Button>
    </div>
  );
}
