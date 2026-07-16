"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Wrench } from "lucide-react";
import {
  MobileDateField,
  MobileSearchShell,
  MobileSearchSubmit,
  MobileTextField,
  startOfToday,
} from "@/components/home/mobile-search-fields";

export function MobileServiceSearch() {
  const router = useRouter();

  const [serviceType, setServiceType] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [serviceDate, setServiceDate] = useState<Date | undefined>();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    const q = [serviceType.trim(), serviceLocation.trim()].filter(Boolean).join(" ");
    if (q) params.set("q", q);
    if (serviceDate) params.set("date", serviceDate.toISOString().slice(0, 10));
    router.push(`/services${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <MobileSearchShell onSubmit={handleSubmit}>
      <MobileTextField
        icon={Wrench}
        value={serviceType}
        onChange={setServiceType}
        placeholder="Service type"
      />

      <MobileTextField
        icon={MapPin}
        value={serviceLocation}
        onChange={setServiceLocation}
        placeholder="Your location"
      />

      <MobileDateField
        label="Preferred date"
        date={serviceDate}
        onSelect={setServiceDate}
        disabled={(d) => d < startOfToday()}
      />

      <MobileSearchSubmit />
    </MobileSearchShell>
  );
}
