"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import {
  MobileCounterField,
  MobileDateField,
  MobileSearchShell,
  MobileSearchSubmit,
  MobileTextField,
  startOfToday,
} from "@/components/home/mobile-search-fields";

export function MobileActivitySearch() {
  const router = useRouter();

  const [location, setLocation] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [participants, setParticipants] = useState(1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("q", location.trim());
    if (date) params.set("date", date.toISOString().slice(0, 10));
    params.set("participants", String(participants));
    router.push(`/activities${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <MobileSearchShell onSubmit={handleSubmit}>
      <MobileTextField
        icon={MapPin}
        value={location}
        onChange={setLocation}
        placeholder="Where do you want to go?"
      />

      <div className="grid grid-cols-2 gap-1.5">
        <MobileDateField
          label="Date"
          date={date}
          onSelect={setDate}
          disabled={(d) => d < startOfToday()}
        />
        <MobileCounterField
          label="Participants"
          value={participants}
          onChange={setParticipants}
          max={20}
        />
      </div>

      <MobileSearchSubmit />
    </MobileSearchShell>
  );
}
