"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StayBookingDialog, type StayBookingDetails } from "@/components/stay/stay-booking-dialog";
import { formatGHS } from "@/lib/format";
import { nightsBetween, parseDateParam, resolveStayRange } from "@/lib/stay-dates";
import type { Property, RoomPerk } from "@/lib/stay-types";
import { cn } from "@/lib/utils";

const perkLabels: Record<RoomPerk, string> = {
  breakfast: "Breakfast included",
  free_cancellation: "Free cancellation",
  pay_at_property: "No prepayment needed — pay at the property",
};

function PerkList({ perks }: { perks: RoomPerk[] }) {
  if (perks.length === 0) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <ul className="flex flex-col gap-1.5">
      {perks.map((perk) => (
        <li key={perk} className="flex items-start gap-1.5 text-sm text-success">
          <Check className="mt-0.5 size-3.5 shrink-0" />
          <span className="font-medium">{perkLabels[perk]}</span>
        </li>
      ))}
    </ul>
  );
}

function GuestIcons({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Sleeps ${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <User key={i} className="size-4 fill-current text-foreground" />
      ))}
    </span>
  );
}

function QtySelect({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-[72px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: max + 1 }).map((_, i) => (
          <SelectItem key={i} value={String(i)}>
            {i}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RoomOfferTable({ property }: { property: Property }) {
  const params = useSearchParams();
  const offers = property.roomTypes ?? [];

  // The searched stay drives the prices; fall back to a valid default.
  const { from: checkIn, to: checkOut } = resolveStayRange({
    checkIn: parseDateParam(params.get("checkin")),
    checkOut: parseDateParam(params.get("checkout")),
    minNights: property.minNights,
  });
  const nights = nightsBetween(checkIn, checkOut);
  const adults = Number(params.get("adults")) || 2;
  const children = Number(params.get("children")) || 0;

  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState<StayBookingDetails | null>(null);

  const selectedRooms = offers
    .map((offer) => ({ offer, qty: qtyById[offer.id] ?? 0 }))
    .filter((s) => s.qty > 0);
  const totalRooms = selectedRooms.reduce((n, s) => n + s.qty, 0);
  const subtotal = selectedRooms.reduce((sum, s) => sum + s.offer.pricePerNight * nights * s.qty, 0);
  const serviceFee = subtotal * 0.05;
  const total = subtotal > 0 ? subtotal + property.cleaningFee + serviceFee : 0;
  const isInstant = property.bookingType === "instant";

  function setQty(id: string, qty: number) {
    setQtyById((prev) => ({ ...prev, [id]: qty }));
  }

  function handleReserve() {
    if (totalRooms === 0) return;
    setPending({
      property,
      checkIn,
      checkOut,
      nights,
      adults,
      children,
      rooms: totalRooms,
      selectedRooms,
      subtotal,
      cleaningFee: property.cleaningFee,
      serviceFee,
      total,
    });
    setDialogOpen(true);
  }

  const nightsLabel = `${nights} night${nights > 1 ? "s" : ""}`;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Prices shown are for {nightsLabel}, {checkIn.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} →{" "}
        {checkOut.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.
      </p>

      {/* Desktop: the full availability table */}
      <div className="hidden overflow-hidden rounded-xl border border-border lg:block">
        <table className="w-full border-collapse text-left">
          <thead className="bg-secondary">
            <tr className="text-sm font-semibold text-secondary-foreground">
              <th className="p-3">Room type</th>
              <th className="p-3">Number of guests</th>
              <th className="p-3">Price for {nightsLabel}</th>
              <th className="p-3">Your choices</th>
              <th className="p-3">Select rooms</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id} className="border-t border-border align-top">
                <td className="p-3">
                  <p className="font-heading text-base font-semibold text-primary">{offer.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{offer.bedSummary}</p>
                </td>
                <td className="p-3">
                  <GuestIcons count={offer.maxGuests} />
                </td>
                <td className="p-3">
                  <p className="font-heading text-lg font-bold text-foreground">
                    {formatGHS(offer.pricePerNight * nights)}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatGHS(offer.pricePerNight)} per night</p>
                </td>
                <td className="p-3">
                  <PerkList perks={offer.perks} />
                </td>
                <td className="p-3">
                  <QtySelect
                    value={qtyById[offer.id] ?? 0}
                    max={offer.roomsLeft}
                    onChange={(v) => setQty(offer.id, v)}
                  />
                  {offer.roomsLeft <= 2 && (
                    <p className="mt-1.5 text-xs font-semibold text-destructive">
                      Only {offer.roomsLeft} left
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: the same offers as stacked cards */}
      <div className="flex flex-col gap-3 lg:hidden">
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-xl border border-border bg-card p-4">
            <p className="font-heading text-base font-semibold text-primary">{offer.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{offer.bedSummary}</p>

            <div className="mt-2 flex items-center gap-2">
              <GuestIcons count={offer.maxGuests} />
              <span className="text-xs text-muted-foreground">Sleeps {offer.maxGuests}</span>
            </div>

            <div className="mt-3">
              <PerkList perks={offer.perks} />
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="font-heading text-lg font-bold text-foreground">
                  {formatGHS(offer.pricePerNight * nights)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatGHS(offer.pricePerNight)} per night · {nightsLabel}
                </p>
                {offer.roomsLeft <= 2 && (
                  <p className="mt-1 text-xs font-semibold text-destructive">Only {offer.roomsLeft} left</p>
                )}
              </div>
              <QtySelect
                value={qtyById[offer.id] ?? 0}
                max={offer.roomsLeft}
                onChange={(v) => setQty(offer.id, v)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary + reserve */}
      <div
        className={cn(
          "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between",
          totalRooms === 0 && "opacity-90"
        )}
      >
        <div>
          {totalRooms === 0 ? (
            <p className="text-sm text-muted-foreground">Select rooms to see your total.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {totalRooms} room{totalRooms > 1 ? "s" : ""} · {nightsLabel} · incl. fees
              </p>
              <p className="font-heading text-2xl font-bold text-foreground">{formatGHS(total)}</p>
            </>
          )}
        </div>
        <Button size="lg" onClick={handleReserve} disabled={totalRooms === 0} className="sm:w-auto">
          {isInstant && <Zap className="size-4 fill-current" />}
          {isInstant ? "I'll reserve" : "Request to Book"}
        </Button>
      </div>

      {/* Mobile sticky bar, once something is selected */}
      {totalRooms > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-card p-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:hidden">
          <div>
            <p className="text-xs text-muted-foreground">
              {totalRooms} room{totalRooms > 1 ? "s" : ""} · {nightsLabel}
            </p>
            <p className="font-heading text-lg font-bold text-foreground">{formatGHS(total)}</p>
          </div>
          <Button onClick={handleReserve}>
            {isInstant && <Zap className="size-4 fill-current" />}
            {isInstant ? "I'll reserve" : "Request"}
          </Button>
        </div>
      )}

      <StayBookingDialog open={dialogOpen} onOpenChange={setDialogOpen} details={pending} />
    </div>
  );
}
