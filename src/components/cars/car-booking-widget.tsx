"use client";

import { useState } from "react";
import { CalendarIcon, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { WishlistButton } from "@/components/wishlist-button";
import { CarBookingDialog, type CarBookingDetails } from "@/components/cars/car-booking-dialog";
import { formatGHS } from "@/lib/format";
import { addDays, daysBetween, startOfToday } from "@/lib/dates";
import { isNightBlocked, toISODate } from "@/lib/availability";
import { isCarAvailable, carBlockedRanges } from "@/lib/car-availability";
import { useCarBookings } from "@/lib/car-bookings-store";
import type { Car } from "@/lib/car-types";

export function CarBookingWidget({ car }: { car: Car }) {
  const defaultPickup = addDays(new Date(), 3);
  const defaultReturn = addDays(defaultPickup, car.minRentalDays);
  const [range, setRange] = useState<{ from: Date; to: Date }>({ from: defaultPickup, to: defaultReturn });
  const [withDriver, setWithDriver] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState<CarBookingDetails | null>(null);

  // Availability: rented days are disabled in the calendar, and a clashing range blocks the reserve.
  const bookings = useCarBookings();
  const blockedRanges = carBlockedRanges(car, bookings);
  const available = isCarAvailable(car, toISODate(range.from), toISODate(range.to), bookings);

  const days = daysBetween(range.from, range.to);
  const dailyRate = withDriver ? car.withDriverPricePerDay : car.pricePerDay;
  const subtotal = dailyRate * days;
  const serviceFee = subtotal * 0.05;
  const total = subtotal + serviceFee;
  const isInstant = car.bookingType === "instant";

  function handleReserve() {
    if (!available) return;
    setPending({
      car,
      pickupDate: range.from,
      returnDate: range.to,
      days,
      withDriver,
      dailyRate,
      subtotal,
      serviceFee,
      total,
    });
    setDialogOpen(true);
  }

  return (
    <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
      <div className="flex items-baseline justify-between">
        <p className="font-heading text-2xl font-bold text-foreground">
          {formatGHS(dailyRate)}
          <span className="text-sm font-normal text-muted-foreground"> / day</span>
        </p>
        <WishlistButton experienceId={car.id} className="static bg-secondary hover:bg-secondary" />
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
                else if (next?.from) setRange({ from: next.from, to: addDays(next.from, car.minRentalDays) });
              }}
              disabled={(d) => d < startOfToday() || isNightBlocked(d, blockedRanges)}
              autoFocus
            />
          </PopoverContent>
        </Popover>

        {car.driverAvailable && (
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <Label htmlFor="with-driver-toggle" className="text-sm font-medium text-foreground">
                Add a chauffeur
              </Label>
              <p className="text-xs text-muted-foreground">{formatGHS(car.withDriverPricePerDay)} / day</p>
            </div>
            <Switch id="with-driver-toggle" checked={withDriver} onCheckedChange={setWithDriver} />
          </div>
        )}

        <Separator />

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>
              {formatGHS(dailyRate)} × {days} day{days > 1 ? "s" : ""}
            </span>
            <span>{formatGHS(subtotal)}</span>
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
          disabled={!available}
          className="w-full"
        >
          {isInstant && <Zap className="size-4 fill-current" />}
          {!available ? "Not available for these dates" : isInstant ? "Reserve" : "Request to Book"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {!available
            ? "This car is booked for those dates. Pick another range to continue."
            : isInstant
              ? "Payment confirms immediately, no vendor approval needed."
              : "You won't be charged yet — the vendor has 24 hours to accept."}
        </p>
      </div>

      <CarBookingDialog open={dialogOpen} onOpenChange={setDialogOpen} details={pending} />
    </div>
  );
}
