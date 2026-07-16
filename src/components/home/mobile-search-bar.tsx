"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MobileStaySearch, readStaySearch } from "@/components/home/mobile-stay-search";
import { MobileActivitySearch } from "@/components/home/mobile-activity-search";
import { MobileCarSearch } from "@/components/home/mobile-car-search";
import { MobileServiceSearch } from "@/components/home/mobile-service-search";
import { parseDateParam } from "@/lib/stay-dates";
import type { ServiceTabId } from "@/lib/service-tabs";

const listingPathByTab: Record<ServiceTabId, string> = {
  stays: "/stay",
  "things-to-do": "/activities",
  "car-rentals": "/cars",
  handyman: "/services",
  restaurants: "/restaurants",
};

/** "17 Jul" */
function shortDate(iso: string | null) {
  const date = parseDateParam(iso);
  return date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : null;
}

function joinParts(parts: (string | null | false)[]) {
  return parts.filter(Boolean).join(" · ");
}

/** The two lines shown on the collapsed bar: where, then when/who. */
function summarise(activeTab: ServiceTabId, params: URLSearchParams) {
  const q = params.get("q")?.trim();
  const from = shortDate(params.get("checkin") ?? params.get("pickup"));
  const to = shortDate(params.get("checkout") ?? params.get("return"));
  const on = shortDate(params.get("date"));
  const range = from && to ? `${from} – ${to}` : from ?? on;

  switch (activeTab) {
    case "stays": {
      const adults = Number(params.get("adults")) || 0;
      const children = Number(params.get("children")) || 0;
      const rooms = Number(params.get("rooms")) || 0;
      const guests = adults + children;
      return {
        primary: q || "Around current location",
        secondary: joinParts([
          range,
          guests > 0 && `${guests} guest${guests > 1 ? "s" : ""}`,
          rooms > 0 && `${rooms} room${rooms > 1 ? "s" : ""}`,
        ]),
      };
    }
    case "things-to-do": {
      const participants = Number(params.get("participants")) || 0;
      return {
        primary: q || "Anywhere in Ghana",
        secondary: joinParts([
          range,
          participants > 0 && `${participants} participant${participants > 1 ? "s" : ""}`,
        ]),
      };
    }
    case "car-rentals":
      return { primary: q || "Any pickup location", secondary: joinParts([range]) };
    case "handyman":
      return { primary: q || "Any service", secondary: joinParts([range]) };
    default:
      return { primary: q || "Search", secondary: "" };
  }
}

/**
 * The collapsed search summary that sits under the header once a search is running.
 * Tapping it reopens the vertical's full search box in a sheet.
 *
 * Note it can't live inside MobileHero — that section is `overflow-hidden`, which
 * stops `position: sticky` from working.
 */
export function MobileSearchBar({
  activeTab,
  mode = "listing",
}: {
  activeTab: ServiceTabId;
  /** "current" re-searches the page you're on (so a detail page reprices in place). */
  mode?: "listing" | "current";
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { primary, secondary } = summarise(activeTab, params);
  const stay = activeTab === "stays" ? readStaySearch(params) : null;

  function handleSearch(next: URLSearchParams) {
    setOpen(false);
    const query = next.toString();
    if (mode === "current") {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      return;
    }
    const path = listingPathByTab[activeTab];
    router.push(query ? `${path}?${query}` : path);
  }

  return (
    <>
      <div className="sticky top-16 z-40 border-b border-border bg-background px-4 py-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border-2 border-search-accent bg-white px-4 py-2.5 text-left shadow-sm"
        >
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-foreground">{primary}</span>
            {secondary && (
              <span className="block truncate text-xs text-muted-foreground">{secondary}</span>
            )}
          </span>
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="top" className="max-h-[92vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit your search</SheetTitle>
          </SheetHeader>
          {/* Remount on each open so the box reflects the search currently on screen. */}
          <div key={params.toString()} className="px-4 pb-6">
            {activeTab === "stays" && stay && (
              <MobileStaySearch
                onSearch={handleSearch}
                initial={stay.initial}
                carryParams={stay.carryParams}
              />
            )}
            {activeTab === "things-to-do" && <MobileActivitySearch onSearch={handleSearch} />}
            {activeTab === "car-rentals" && <MobileCarSearch onSearch={handleSearch} />}
            {activeTab === "handyman" && <MobileServiceSearch onSearch={handleSearch} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
