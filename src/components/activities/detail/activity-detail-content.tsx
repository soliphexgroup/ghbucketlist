import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Clock, MapPin, Users } from "lucide-react";
import { Container } from "@/components/container";
import { CategoryBadge } from "@/components/category-badge";
import { StarRating } from "@/components/star-rating";
import { Separator } from "@/components/ui/separator";
import { Gallery } from "@/components/activities/detail/gallery";
import { BookingWidget } from "@/components/activities/detail/booking-widget";
import { VenueMap } from "@/components/activities/detail/venue-map";
import { ReviewsSection } from "@/components/activities/detail/reviews-section";
import { formatDuration, formatGHS, formatScheduleDays } from "@/lib/format";
import type { Category, Experience, Host, Review } from "@/lib/types";

export function ActivityDetailContent({
  experience,
  category,
  host,
  reviews,
}: {
  experience: Experience;
  category: Category | undefined;
  host: Host | undefined;
  reviews: Review[];
}) {
  const mapQuery = `${experience.venueName}, ${experience.neighbourhood}, ${experience.city}`;

  return (
    <Container className="py-6 sm:py-8">
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/activities" className="hover:text-primary">
          Activities
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{experience.title}</span>
      </nav>

      <Gallery images={experience.images} title={experience.title} />

      <div className="mt-8 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {category && <CategoryBadge name={category.name} colorHex={category.colorHex} />}
          <StarRating rating={experience.rating} reviewCount={experience.reviewCount} />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          {experience.title}
        </h1>
        <a
          href={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <MapPin className="size-4" />
          {experience.venueName}, {experience.neighbourhood}
        </a>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-10">
          {host && (
            <div className="flex items-center gap-3">
              <Image
                src={host.avatarUrl}
                alt={host.name}
                width={48}
                height={48}
                className="size-12 rounded-full object-cover"
              />
              <div>
                <p className="text-sm text-muted-foreground">Hosted by</p>
                <p className="font-heading text-base font-semibold text-foreground">
                  {host.name}
                </p>
              </div>
              <span className="ml-auto text-sm text-muted-foreground">
                Joined {host.joinedYear}
              </span>
            </div>
          )}

          <Separator />

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              About this Experience
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {experience.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
                <Clock className="size-4" />
                {formatDuration(experience.durationMinutes)}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
                <Users className="size-4" />
                Up to {experience.maxCapacity} guests
              </span>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">Ticket Types</h2>
            <div className="mt-4 flex flex-col gap-3">
              {experience.ticketTypes.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{ticket.name}</p>
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground">{ticket.description}</p>
                    )}
                  </div>
                  <p className="font-heading font-semibold text-foreground">
                    {formatGHS(ticket.priceGHS)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">Schedule</h2>
            <p className="mt-3 text-muted-foreground">
              {formatScheduleDays(experience.scheduleDays)} at {experience.scheduleTime}
            </p>
          </section>

          {experience.whatsIncluded.length > 0 && (
            <>
              <Separator />
              <section>
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  What&apos;s Included
                </h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {experience.whatsIncluded.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-muted-foreground">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          <Separator />

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              Experience Location
            </h2>
            <p className="mt-2 text-muted-foreground">
              Located in {experience.neighbourhood}, {experience.city}
            </p>
            <div className="mt-4">
              <VenueMap query={mapQuery} />
            </div>
          </section>

          <Separator />

          <ReviewsSection
            rating={experience.rating}
            reviewCount={experience.reviewCount}
            reviews={reviews}
          />
        </div>

        <div>
          <BookingWidget experience={experience} />
        </div>
      </div>
    </Container>
  );
}
