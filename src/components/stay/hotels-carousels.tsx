"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/container";
import { PropertyCard } from "@/components/stay/property-card";
import { listProperties } from "@/lib/stay-repository";
import { useDbStayListings } from "@/lib/db-listings";
import { ACCRA_CENTER, haversineKm, neighbourhoodCoords, type LatLng } from "@/lib/accra-geo";
import type { Property } from "@/lib/stay-types";

const HOW_MANY = 8;

type Card = { property: Property; note?: string };

function HotelCarousel({
  title,
  subtitle,
  cards,
  headerAction,
}: {
  title: string;
  subtitle: string;
  cards: Card[];
  /** Optional control shown in the header (e.g. a "Use my location" button). */
  headerAction?: React.ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function nudge(direction: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }

  if (cards.length === 0) return null;

  return (
    <section className="py-8 sm:py-10">
      <Container className="max-w-[64rem] lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerAction}
            <button
              type="button"
              aria-label={`Scroll ${title} left`}
              onClick={() => nudge(-1)}
              className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label={`Scroll ${title} right`}
              onClick={() => nudge(1)}
              className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div
          ref={scroller}
          className="no-scrollbar mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
        >
          {cards.map(({ property, note }) => (
            <PropertyCard
              key={property.id}
              property={property}
              note={note}
              className="w-64 shrink-0 snap-start sm:w-72"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

/**
 * Two marketing carousels for the Stays landing: top-rated stays, and stays sorted by how close
 * they are to the visitor. Nearby uses the browser's geolocation when granted, and falls back to
 * central Accra otherwise so the row is always populated.
 */
export function HotelsCarousels() {
  // Real, published stays only — no seed fallback. While the DB loads (or when it's genuinely
  // empty) the catalog is empty and each HotelCarousel renders nothing (returns null for 0 cards),
  // so the sections appear once real listings arrive rather than showing demo data.
  const catalog = useDbStayListings();

  const recommended = useMemo<Card[]>(
    () => listProperties({ sort: "recommended" }, catalog).slice(0, HOW_MANY).map((property) => ({ property })),
    [catalog]
  );

  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const located = origin !== null;
  const from = origin ?? ACCRA_CENTER;

  // Only ask for the visitor's location when they click the button — never on load.
  function requestLocation() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("idle");
      },
      () => setStatus("error"),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  }

  const locationButton = located ? null : (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={requestLocation}
      disabled={status === "loading"}
      className="gap-1.5"
    >
      {status === "loading" ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <MapPin className="size-4" />
      )}
      {status === "loading" ? "Locating…" : status === "error" ? "Try again" : "Use my location"}
    </Button>
  );

  const nearby = useMemo<Card[]>(() => {
    return catalog
      .map((property) => ({
        property,
        km: haversineKm(from, neighbourhoodCoords(property.neighbourhood) ?? ACCRA_CENTER),
      }))
      .sort((a, b) => a.km - b.km)
      .slice(0, HOW_MANY)
      .map(({ property, km }) => {
        const distance = km < 1 ? "< 1 km" : `${Math.round(km)} km`;
        return { property, note: located ? `${distance} away` : `${distance} from central Accra` };
      });
  }, [catalog, from, located]);

  return (
    <>
      <HotelCarousel
        title="Recommended Stays"
        subtitle="Top-rated stays on GHBucketlist"
        cards={recommended}
      />
      <HotelCarousel
        title="Nearby Stays"
        subtitle={
          located
            ? "Closest to you right now"
            : status === "error"
              ? "Couldn't access your location — showing central Accra"
              : "Closest to central Accra — use your location for exact distances"
        }
        cards={nearby}
        headerAction={locationButton}
      />
    </>
  );
}
