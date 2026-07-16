"use client";

import { useSearchParams } from "next/navigation";
import { Container } from "@/components/container";
import { MobileSearchBar } from "@/components/home/mobile-search-bar";
import { MobileStaySearch, readStaySearch } from "@/components/home/mobile-stay-search";
import { BrowseByPropertyType } from "@/components/stay/browse-by-property-type";
import { StayBrowser } from "@/components/stay/stay-browser";

/**
 * On mobile the listing is search-first: drilling in from a property-type tile shows the
 * search box and withholds the results until a search has run. Dates in the URL are what
 * mark a search as having happened. Once it has, the box collapses to the sticky bar so
 * the results aren't pushed off screen by a form. Desktop always shows tiles and results.
 */
export function StaySearchAndResults() {
  const params = useSearchParams();

  const hasSearched = Boolean(params.get("checkin") || params.get("checkout"));
  const drilledIn = params.has("type") || params.has("sort");
  const { initial, carryParams } = readStaySearch(params);

  return (
    <>
      {/* Once you've drilled into a type the tiles are just noise on a small screen. */}
      <div className={drilledIn ? "hidden lg:block" : undefined}>
        <BrowseByPropertyType />
      </div>

      {hasSearched ? (
        <MobileSearchBar activeTab="stays" />
      ) : (
        <Container className="pt-4 pb-2 lg:hidden">
          <MobileStaySearch carryParams={carryParams} initial={initial} />
        </Container>
      )}

      <div className={hasSearched ? undefined : "hidden lg:block"}>
        <StayBrowser />
      </div>
    </>
  );
}
