"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import {
  MobileDateField,
  MobileSearchShell,
  MobileSearchSubmit,
  MobileTextField,
  addDays,
  startOfToday,
} from "@/components/home/mobile-search-fields";

export function MobileCarSearch() {
  const router = useRouter();

  const [location, setLocation] = useState("");
  const [pickupDate, setPickupDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [returnDate, setReturnDate] = useState<Date | undefined>(addDays(new Date(), 3));

  function handlePickupSelect(next: Date | undefined) {
    setPickupDate(next);
    // Keep the rental valid: the car must come back after it goes out.
    if (next && returnDate && returnDate <= next) setReturnDate(addDays(next, 1));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("q", location.trim());
    if (pickupDate) params.set("pickup", pickupDate.toISOString().slice(0, 10));
    if (returnDate) params.set("return", returnDate.toISOString().slice(0, 10));
    router.push(`/cars${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <MobileSearchShell onSubmit={handleSubmit}>
      <MobileTextField
        icon={MapPin}
        value={location}
        onChange={setLocation}
        placeholder="Pickup location"
      />

      <div className="grid grid-cols-2 gap-1.5">
        <MobileDateField
          label="Pickup date"
          date={pickupDate}
          onSelect={handlePickupSelect}
          disabled={(d) => d < startOfToday()}
        />
        <MobileDateField
          label="Return date"
          date={returnDate}
          onSelect={setReturnDate}
          disabled={(d) => d <= (pickupDate ?? startOfToday())}
        />
      </div>

      <MobileSearchSubmit />
    </MobileSearchShell>
  );
}
