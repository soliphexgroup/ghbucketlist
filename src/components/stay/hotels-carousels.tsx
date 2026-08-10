"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/container";
import { PropertyCard } from "@/components/stay/property-card";
import { listProperties } from "@/lib/stay-repository";
import { useDbStayListings } from "@/lib/db-listings";
import { properties as seedProperties } from "@/data/properties";
import { ACCRA_CENTER, haversineKm, neighbourhoodCoords, type LatLng } from "@/lib/accra-geo";
import type { Property } from "@/lib/stay-types";

const HOW_MANY = 8;

type Card = { property: Property; note?: string };

function HotelCarousel({
  title,
  subtitle,
  cards,
}: {
  title: string;
  subtitle: string;
  cards: Card[];
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
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex shrink-0 gap-2">
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
  const dbCatalog = useDbStayListings();
  // The DB hook is empty on first paint; fall back to the seed catalog so the sections never flash empty.
  const catalog = dbCatalog.length > 0 ? dbCatalog : seedProperties;

  const recommended = useMemo<Card[]>(
    () => listProperties({ sort: "recommended" }, catalog).slice(0, HOW_MANY).map((property) => ({ property })),
    [catalog]
  );

  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [located, setLocated] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocated(true);
      },
      () => {
        // Denied or unavailable: keep the central-Accra fallback below.
      },
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  }, []);

  const from = origin ?? ACCRA_CENTER;

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
        title="Recommended hotels"
        subtitle="Top-rated stays on GH Bucketlist"
        cards={recommended}
      />
      <HotelCarousel
        title="Nearby hotels"
        subtitle={located ? "Closest to you right now" : "Closest to central Accra — allow location for exact distances"}
        cards={nearby}
      />
    </>
  );
}
