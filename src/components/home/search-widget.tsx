"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarIcon, Check, ChevronDown, MapPin, Minus, Plus, Search, Users, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listPropertyNeighbourhoods } from "@/lib/stay-repository";
import type { ServiceTabId } from "@/lib/service-tabs";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatShort(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function FieldShell({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-12 flex-1 items-center gap-2.5 px-4 sm:border-r sm:border-border last:border-r-0">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      {children}
    </div>
  );
}

function LocationField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const neighbourhoods = listPropertyNeighbourhoods();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-12 w-full flex-1 items-center gap-2.5 px-4 text-left sm:border-r sm:border-border"
        >
          <MapPin className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm text-foreground">
            {value || <span className="text-muted-foreground">{placeholder}</span>}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Neighbourhoods with places to stay
        </p>
        <div className="flex max-h-72 flex-col overflow-y-auto">
          {neighbourhoods.map((n) => {
            const isSelected = n === value;
            return (
              <button
                key={n}
                type="button"
                onClick={() => {
                  onChange(n);
                  setOpen(false);
                }}
                className={`flex items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-muted ${
                  isSelected ? "bg-accent font-medium text-primary" : "text-foreground"
                }`}
              >
                {n}
                {isSelected && <Check className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DateField({
  label,
  date,
  onSelect,
}: {
  label: string;
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="flex h-12 w-full flex-1 items-center gap-2.5 px-4 text-left sm:border-r sm:border-border">
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex flex-col">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-sm text-foreground">
              {date ? formatShort(date) : <span className="text-muted-foreground">Select date</span>}
            </span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          // Otherwise it opens on the current month, not the selected date's.
          defaultMonth={date}
          onSelect={onSelect}
          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function DateRangeField({
  checkIn,
  checkOut,
  onSelect,
}: {
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  onSelect: (range: { from: Date; to: Date }) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="flex h-12 w-full flex-[1.3] items-center gap-2.5 px-4 text-left sm:border-r sm:border-border">
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-foreground">
            {checkIn && checkOut ? (
              <>
                {formatShort(checkIn)} — {formatShort(checkOut)}
              </>
            ) : (
              <span className="text-muted-foreground">Select dates</span>
            )}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={checkIn && checkOut ? { from: checkIn, to: checkOut } : undefined}
          // Otherwise it opens on the current month, not the stay's.
          defaultMonth={checkIn}
          onSelect={(next) => {
            if (next?.from && next?.to) onSelect({ from: next.from, to: next.to });
            else if (next?.from) onSelect({ from: next.from, to: addDays(next.from, 2) });
          }}
          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function CounterField({
  label,
  value,
  onChange,
  min = 1,
  max = 16,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex h-12 flex-1 items-center justify-between gap-2 px-4">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}
          className="flex size-6 items-center justify-center rounded-full border border-border hover:bg-muted"
        >
          <Minus className="size-3" />
        </button>
        <span className="w-4 text-center text-sm font-medium text-foreground">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Increase ${label}`}
          className="flex size-6 items-center justify-center rounded-full border border-border hover:bg-muted"
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  );
}

export type GuestCounts = { adults: number; children: number; rooms: number; pets: boolean };

function GuestCounterRow({
  label,
  value,
  onChange,
  max = 20,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-4 rounded-md border border-border px-3 py-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Decrease ${label}`}
          disabled={value <= 0}
          className="text-primary disabled:opacity-30"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-4 text-center text-sm font-medium text-foreground">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Increase ${label}`}
          className="text-primary"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function GuestsRoomsEditor({
  initial,
  onDone,
}: {
  initial: GuestCounts;
  onDone: (value: GuestCounts) => void;
}) {
  const [draft, setDraft] = useState<GuestCounts>(initial);

  function updateDraft(patch: Partial<GuestCounts>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <GuestCounterRow label="Adults" value={draft.adults} onChange={(v) => updateDraft({ adults: v })} />
        <GuestCounterRow label="Children" value={draft.children} onChange={(v) => updateDraft({ children: v })} />
        <GuestCounterRow label="Rooms" value={draft.rooms} onChange={(v) => updateDraft({ rooms: v })} />
      </div>

      <div className="my-4 h-px bg-border" />

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-foreground">Travelling with pets?</span>
        <Switch checked={draft.pets} onCheckedChange={(checked) => updateDraft({ pets: checked })} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Assistance animals aren&apos;t considered pets.
        <br />
        <a href="#" className="text-primary hover:underline">
          Read more about travelling with assistance animals
        </a>
      </p>

      <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => onDone(draft)}>
        Done
      </Button>
    </>
  );
}

function GuestsRoomsField({
  value,
  onChange,
}: {
  value: GuestCounts;
  onChange: (value: GuestCounts) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex h-12 flex-1 items-center gap-2.5 px-4 text-left">
          <Users className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm text-foreground">
            {value.adults} Adults · {value.children} Children · {value.rooms} Room{value.rooms === 1 ? "" : "s"}
          </span>
          <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-5" align="end">
        {open && (
          <GuestsRoomsEditor
            key={`${value.adults}-${value.children}-${value.rooms}-${value.pets}`}
            initial={value}
            onDone={(next) => {
              onChange(next);
              setOpen(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

export function SearchWidget({ activeTab }: { activeTab: ServiceTabId }) {
  const router = useRouter();

  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState<Date | undefined>(addDays(new Date(), 7));
  const [checkOut, setCheckOut] = useState<Date | undefined>(addDays(new Date(), 9));
  const [stayGuests, setStayGuests] = useState<GuestCounts>({
    adults: 0,
    children: 0,
    rooms: 0,
    pets: false,
  });

  const [activityLocation, setActivityLocation] = useState("");
  const [activityDate, setActivityDate] = useState<Date | undefined>();
  const [participants, setParticipants] = useState(1);

  const [pickupDate, setPickupDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [returnDate, setReturnDate] = useState<Date | undefined>(addDays(new Date(), 3));

  const [serviceType, setServiceType] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [serviceDate, setServiceDate] = useState<Date | undefined>();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();

    switch (activeTab) {
      case "stays": {
        if (location.trim()) params.set("q", location.trim());
        if (checkIn) params.set("checkin", checkIn.toISOString().slice(0, 10));
        if (checkOut) params.set("checkout", checkOut.toISOString().slice(0, 10));
        // Kept separate (rather than one total) so the booking widget can restore them.
        if (stayGuests.adults > 0) params.set("adults", String(stayGuests.adults));
        if (stayGuests.children > 0) params.set("children", String(stayGuests.children));
        if (stayGuests.rooms > 0) params.set("rooms", String(stayGuests.rooms));
        if (stayGuests.pets) params.set("pets", "1");
        router.push(`/stay${params.toString() ? `?${params.toString()}` : ""}`);
        return;
      }
      case "things-to-do": {
        if (activityLocation.trim()) params.set("q", activityLocation.trim());
        if (activityDate) params.set("date", activityDate.toISOString().slice(0, 10));
        params.set("participants", String(participants));
        router.push(`/activities${params.toString() ? `?${params.toString()}` : ""}`);
        return;
      }
      case "car-rentals": {
        if (location.trim()) params.set("q", location.trim());
        if (pickupDate) params.set("pickup", pickupDate.toISOString().slice(0, 10));
        if (returnDate) params.set("return", returnDate.toISOString().slice(0, 10));
        router.push(`/cars${params.toString() ? `?${params.toString()}` : ""}`);
        return;
      }
      case "handyman": {
        const q = [serviceType.trim(), serviceLocation.trim()].filter(Boolean).join(" ");
        if (q) params.set("q", q);
        if (serviceDate) params.set("date", serviceDate.toISOString().slice(0, 10));
        router.push(`/services${params.toString() ? `?${params.toString()}` : ""}`);
        return;
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col overflow-hidden rounded-lg border-4 border-search-accent bg-white shadow-2xl sm:flex-row"
    >
      {activeTab === "stays" && (
        <>
          <LocationField value={location} onChange={setLocation} placeholder="Where do you want to go?" />
          <DateRangeField checkIn={checkIn} checkOut={checkOut} onSelect={({ from, to }) => { setCheckIn(from); setCheckOut(to); }} />
          <GuestsRoomsField value={stayGuests} onChange={setStayGuests} />
        </>
      )}

      {activeTab === "things-to-do" && (
        <>
          <FieldShell icon={MapPin}>
            <Input
              value={activityLocation}
              onChange={(e) => setActivityLocation(e.target.value)}
              placeholder="Where do you want to go?"
              className="h-full border-0 p-0 shadow-none focus-visible:ring-0"
            />
          </FieldShell>
          <DateField label="Date" date={activityDate} onSelect={setActivityDate} />
          <CounterField label="Participants" value={participants} onChange={setParticipants} max={20} />
        </>
      )}

      {activeTab === "car-rentals" && (
        <>
          <FieldShell icon={MapPin}>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Pickup location"
              className="h-full border-0 p-0 shadow-none focus-visible:ring-0"
            />
          </FieldShell>
          <DateField label="Pickup date" date={pickupDate} onSelect={setPickupDate} />
          <DateField label="Return date" date={returnDate} onSelect={setReturnDate} />
        </>
      )}

      {activeTab === "handyman" && (
        <>
          <FieldShell icon={Wrench}>
            <Input
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="Service type"
              className="h-full border-0 p-0 shadow-none focus-visible:ring-0"
            />
          </FieldShell>
          <FieldShell icon={MapPin}>
            <Input
              value={serviceLocation}
              onChange={(e) => setServiceLocation(e.target.value)}
              placeholder="Your location"
              className="h-full border-0 p-0 shadow-none focus-visible:ring-0"
            />
          </FieldShell>
          <DateField label="Preferred date" date={serviceDate} onSelect={setServiceDate} />
        </>
      )}

      <motion.button
        type="submit"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="flex h-12 shrink-0 items-center justify-center gap-2 bg-search-button px-8 text-base font-bold text-search-button-foreground transition-colors duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-search-accent"
      >
        <Search className="size-4" />
        Search
      </motion.button>
    </form>
  );
}
