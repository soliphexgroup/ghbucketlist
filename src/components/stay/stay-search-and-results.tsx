"use client";

import { useSearchParams } from "next/navigation";
import { Container } from "@/components/container";
import { MobileStaySearch } from "@/components/home/mobile-stay-search";
import { BrowseByPropertyType } from "@/components/stay/browse-by-property-type";
import { StayBrowser } from "@/components/stay/stay-browser";

/** Parse a `YYYY-MM-DD` param as a local date (not UTC, which can shift the day). */
function parseDate(value: string | null) {
  if (!value) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * On mobile the listing is search-first: drilling in from a property-type tile shows the
 * search box and withholds the results until a search has run. Dates in the URL are what
 * mark a search as having happened. Desktop always shows the tiles and the results.
 */
export function StaySearchAndResults() {
  const params = useSearchParams();

  const checkin = params.get("checkin");
  const checkout = params.get("checkout");
  const hasSearched = Boolean(checkin || checkout);

  // Every property-type tile lands here with a type (or sort, for Getaways).
  const drilledIn = params.has("type") || params.has("sort");

  const adults = Number(params.get("adults")) || 0;
  const children = Number(params.get("children")) || 0;
  const rooms = Number(params.get("rooms")) || 0;
  const hasGuestCounts = params.has("adults") || params.has("children") || params.has("rooms");

  return (
    <>
      {/* Once you've drilled into a type the tiles are just noise on a small screen. */}
      <div className={drilledIn ? "hidden lg:block" : undefined}>
        <BrowseByPropertyType />
      </div>

      <Container className="pt-4 pb-2 lg:hidden">
        <MobileStaySearch
          // Remount when the search changes so the box mirrors the results on screen.
          key={params.toString()}
          carryParams={{ type: params.get("type"), sort: params.get("sort") }}
          initial={{
            q: params.get("q") ?? "",
            checkIn: parseDate(checkin),
            checkOut: parseDate(checkout),
            guests: hasGuestCounts
              ? { adults, children, rooms, pets: params.get("pets") === "1" }
              : undefined,
          }}
        />
      </Container>

      <div className={hasSearched ? undefined : "hidden lg:block"}>
        <StayBrowser />
      </div>
    </>
  );
}
