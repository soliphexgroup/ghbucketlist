import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Clock } from "lucide-react";
import type { ServiceProvider } from "@/lib/service-types";
import { serviceCategoryLabels } from "@/data/service-categories";
import { StarRating } from "@/components/star-rating";
import { WishlistButton } from "@/components/wishlist-button";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProviderCard({ provider, className }: { provider: ServiceProvider; className?: string }) {
  return (
    <Link
      href={`/services/${provider.slug}`}
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
        className
      )}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden">
        <Image
          src={provider.portfolioImages[0]}
          alt={provider.name}
          fill
          sizes="(min-width: 1024px) 320px, 45vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
          {serviceCategoryLabels[provider.category]}
        </span>
        <WishlistButton experienceId={provider.id} className="absolute top-3 right-3" />
        {provider.verified && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
            <BadgeCheck className="size-3" />
            Verified
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <div className="flex items-center gap-2">
          <Image src={provider.avatarUrl} alt={provider.name} width={28} height={28} className="size-7 shrink-0 rounded-full object-cover" />
          <h3 className="line-clamp-1 font-heading text-sm font-semibold text-foreground sm:text-base">{provider.name}</h3>
        </div>
        <p className="truncate text-xs text-muted-foreground sm:text-sm">{provider.serviceArea}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
          <Clock className="size-3.5 shrink-0" />
          <span className="truncate">Responds in ~{provider.responseTimeMinutes} min</span>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2">
          <StarRating rating={provider.rating} reviewCount={provider.reviewCount} />
          <span className="font-heading text-base font-semibold text-foreground">
            {formatGHS(provider.hourlyRate)}
            <span className="text-xs font-normal text-muted-foreground"> /hr</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
