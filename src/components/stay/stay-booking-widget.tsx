"use client";

import { useState } from "react";
import { CalendarIcon, Minus, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { WishlistButton } from "@/components/wishlist-button";
import { StayBookingDialog, type StayBookingDetails } from "@/components/stay/stay-booking-dialog";
import { formatGHS } from "@/lib/format";
import type { Property } from "@/lib/stay-types";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function nightsBetween(from: Date, to: Date) {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000));
}

export function StayBookingWidget({ property }: { property: Property }) {
  const defaultCheckIn = addDays(new Date(), 7);
  const defaultCheckOut = addDays(defaultCheckIn, property.minNights);
  const [range, setRange] = useState<{ from: Date; to: Date }>({ from: defaultCheckIn, to: defaultCheckOut });
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState<StayBookingDetails | null>(null);

  const nights = nightsBetween(range.from, range.to);
  const subtotal = property.pricePerNight * nights;
  const serviceFee = subtotal * 0.05;
  const total = subtotal + property.cleaningFee + serviceFee;
  const totalGuests = adults + children;
  const isInstant = property.bookingType === "instant";

  function handleReserve() {
    setPending({
      property,
      checkIn: range.from,
      checkOut: range.to,
      nights,
      adults,
      children,
      subtotal,
      cleaningFee: property.cleaningFee,
      serviceFee,
      total,
    });
    setDialogOpen(true);
  }

  return (
    <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
      <div className="flex items-baseline justify-between">
        <p className="font-heading text-2xl font-bold text-foreground">
          {formatGHS(property.pricePerNight)}
          <span className="text-sm font-normal text-muted-foreground"> / night</span>
        </p>
        <WishlistButton experienceId={property.id} className="static bg-secondary hover:bg-secondary" />
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2 font-normal">
              <CalendarIcon className="size-4" />
              {range.from.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} →{" "}
              {range.to.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={range}
              onSelect={(next) => {
                if (next?.from && next?.to) setRange({ from: next.from, to: next.to });
                else if (next?.from) setRange({ from: next.from, to: addDays(next.from, property.minNights) });
              }}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              autoFocus
            />
          </PopoverContent>
        </Popover>

        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Guests</Label>
          <div className="mt-2 flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Adults</span>
              <Stepper value={adults} onChange={setAdults} min={1} max={property.maxGuests - children} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Children</span>
              <Stepper value={children} onChange={setChildren} min={0} max={property.maxGuests - adults} />
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Max {property.maxGuests} guests</p>
        </div>

        <Separator />

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>
              {formatGHS(property.pricePerNight)} × {nights} nights
            </span>
            <span>{formatGHS(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Cleaning fee</span>
            <span>{formatGHS(property.cleaningFee)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Service fee</span>
            <span>{formatGHS(serviceFee)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-base font-semibold text-foreground">
          <span>Total</span>
          <span>{formatGHS(total)}</span>
        </div>

        <Button
          size="lg"
          onClick={handleReserve}
          disabled={totalGuests > property.maxGuests}
          className="w-full"
        >
          {isInstant && <Zap className="size-4 fill-current" />}
          {isInstant ? "Reserve" : "Request to Book"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {isInstant
            ? "Payment confirms immediately, no host approval needed."
            : "You won't be charged yet — the host has 24 hours to accept."}
        </p>
      </div>

      <StayBookingDialog open={dialogOpen} onOpenChange={setDialogOpen} details={pending} />
    </div>
  );
}

function Stepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease"
        className="flex size-7 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted disabled:opacity-40"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-4 text-center text-sm font-medium text-foreground">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase"
        className="flex size-7 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted disabled:opacity-40"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
