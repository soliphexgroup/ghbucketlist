"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import {
  MobileDateField,
  MobileSearchShell,
  MobileSearchSubmit,
  MobileTextField,
  startOfToday,
} from "@/components/home/mobile-search-fields";

export function MobileActivitySearch({
  onSearch,
}: {
  /** Takes over from the default "go to the listing" — used where a search edits the page it's on. */
  onSearch?: (params: URLSearchParams) => void;
} = {}) {
  const router = useRouter();

  const [location, setLocation] = useState("");
  const [date, setDate] = useState<Date | undefined>();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("q", location.trim());
    if (date) params.set("date", date.toISOString().slice(0, 10));
    // Searching with nothing filled in still means "show me results", so say so
    // explicitly rather than landing back on the category tiles.
    if ([...params.keys()].length === 0) params.set("searched", "1");
    if (onSearch) {
      onSearch(params);
      return;
    }
    router.push(`/activities?${params.toString()}`);
  }

  return (
    <MobileSearchShell onSubmit={handleSubmit}>
      <MobileTextField
        icon={MapPin}
        value={location}
        onChange={setLocation}
        placeholder="Where do you want to go?"
      />

      <MobileDateField
        label="Date"
        date={date}
        onSelect={setDate}
        disabled={(d) => d < startOfToday()}
      />

      <MobileSearchSubmit />
    </MobileSearchShell>
  );
}
