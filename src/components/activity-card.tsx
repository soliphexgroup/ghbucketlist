import Image from "next/image";
import Link from "next/link";
import { MapPin, Zap } from "lucide-react";
import type { Experience } from "@/lib/types";
import { getExperienceCategory, getExperienceHost } from "@/lib/repository";
import { getPriceFrom, getExperienceBySlug } from "@/data/experiences";
import { formatGHS } from "@/lib/format";
import { CategoryBadge } from "@/components/category-badge";
import { StarRating } from "@/components/star-rating";
import { WishlistButton } from "@/components/wishlist-button";
import { cn } from "@/lib/utils";

export function ActivityCard({
  experience,
  className,
}: {
  experience: Experience;
  className?: string;
}) {
  const category = getExperienceCategory(experience);
  const host = getExperienceHost(experience);
  const price = getPriceFrom(experience);
  const isStaticExperience = Boolean(getExperienceBySlug(experience.slug));
  const href = isStaticExperience
    ? `/activities/${experience.slug}`
    : `/activities/preview?slug=${encodeURIComponent(experience.slug)}`;

  return (
    <Link
      href={href}
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
        className
      )}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden">
        <Image
          src={experience.images[0]}
          alt={experience.title}
          fill
          sizes="(min-width: 1024px) 320px, 45vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {category && <CategoryBadge name={category.name} colorHex={category.colorHex} />}
        </div>
        <WishlistButton experienceId={experience.id} className="absolute top-3 right-3" />
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
          <Zap className="size-3 fill-current" />
          {experience.gpPoints} GP
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug text-foreground sm:text-base">
            {experience.title}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {experience.neighbourhood} · {host?.name}
          </span>
        </div>

        <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
          {experience.shortDescription}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2">
          <StarRating rating={experience.rating} reviewCount={experience.reviewCount} className="whitespace-nowrap" />
          <span className="whitespace-nowrap font-heading text-base font-semibold text-foreground">
            {formatGHS(price)}
            {price > 0 && <span className="text-xs font-normal text-muted-foreground"> /person</span>}
          </span>
        </div>
      </div>
    </Link>
  );
}
