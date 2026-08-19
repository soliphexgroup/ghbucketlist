"use client";

import { useState } from "react";
import { CalendarIcon, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { WishlistButton } from "@/components/wishlist-button";
import { ShareButtons } from "@/components/activities/detail/share-buttons";
import {
  WorkspaceBookingDialog,
  type WorkspaceBookingDetails,
} from "@/components/activities/detail/workspace-booking-dialog";
import { formatGHS } from "@/lib/format";
import { toISODate } from "@/lib/availability";
import { startOfToday } from "@/lib/dates";
import { useListingBookedRanges, dbSeatsLeft } from "@/lib/db-availability";
import {
  cheapestRate,
  rateUnitLabel,
  rateUnitSuffix,
  spanEnd,
  workspaceSubtotal,
} from "@/lib/workspace-rates";
import type { Experience, RateUnit } from "@/lib/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function WorkspaceBookingWidget({ experience }: { experience: Experience }) {
  const rates = experience.workspaceRates ?? [];
  const [unit, setUnit] = useState<RateUnit>(rates[0]?.unit ?? "day");
  const rate = rates.find((r) => r.unit === unit) ?? rates[0];

  const minCount = rate?.minQty ?? 1;
  const maxCount = rate?.maxQty ?? 99;
  const [count, setCount] = useState(minCount);
  const [desks, setDesks] = useState(1);
  const [start, setStart] = useState<Date>(() => startOfToday());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState<WorkspaceBookingDetails | null>(null);

  // Real, shared availability: desks free across the whole span = capacity minus everyone's
  // overlapping bookings (a host block zeroes it out). Whole-room listings have capacity 1.
  const { ranges } = useListingBookedRanges(experience.id);
  const capacity = experience.deskBased ? experience.maxCapacity : 1;
  const end = rate ? spanEnd(start, rate.unit, count) : start;
  const seatsLeft = dbSeatsLeft(capacity, ranges, toISODate(start), toISODate(end));
  const maxDesks = experience.deskBased ? seatsLeft : 1;
  const available = rate != null && seatsLeft >= desks && desks >= 1;

  const subtotal = rate ? workspaceSubtotal(rate, count, desks) : 0;
  const total = subtotal;

  const fromRate = cheapestRate(rates);

  function selectUnit(nextUnit: RateUnit) {
    const nextRate = rates.find((r) => r.unit === nextUnit);
    setUnit(nextUnit);
    setCount(clamp(count, nextRate?.minQty ?? 1, nextRate?.maxQty ?? 99));
  }

  function handleReserve() {
    if (!rate || !available) return;
    setPending({
      experience,
      rate,
      count,
      desks: experience.deskBased ? desks : 1,
      start,
      end,
      subtotal,
      total,
    });
    setDialogOpen(true);
  }

  if (!rate) {
    return (
      <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
        <p className="text-sm text-muted-foreground">
          Online booking for this workspace isn&apos;t available yet. Please contact the host.
        </p>
      </div>
    );
  }

  return (
    <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
      <div className="flex items-baseline justify-between">
        <p className="font-heading text-2xl font-bold text-foreground">
          {formatGHS(fromRate?.price ?? rate.price)}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / {rateUnitSuffix(fromRate?.unit ?? rate.unit)}
          </span>
        </p>
        <WishlistButton
          experienceId={experience.id}
          className="static bg-secondary hover:bg-secondary"
        />
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {rates.length > 1 && (
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Rate
            </Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {rates.map((r) => (
                <button
                  key={r.unit}
                  type="button"
                  onClick={() => selectUnit(r.unit)}
                  className={`rounded-lg border px-2 py-2 text-center text-sm capitalize transition-colors ${
                    r.unit === unit
                      ? "border-primary bg-accent font-medium text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {rateUnitLabel(r.unit)}
                  <span className="block text-xs text-muted-foreground">{formatGHS(r.price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Start date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="mt-2 w-full justify-start gap-2 font-normal">
                <CalendarIcon className="size-4" />
                {start.toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={start}
                defaultMonth={start}
                onSelect={(d) => d && setStart(d)}
                disabled={(d) => d < startOfToday()}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Duration
          </Label>
          <div className="mt-2 flex items-center justify-between rounded-lg border border-border px-3 py-1.5">
            <span className="text-sm text-foreground">
              {count} {rateUnitLabel(rate.unit, count)}
            </span>
            <Stepper
              value={count}
              onChange={setCount}
              min={minCount}
              max={maxCount}
              decLabel="Decrease duration"
              incLabel="Increase duration"
            />
          </div>
          {rate.unit === "hour" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Hourly pass — your {experience.deskBased ? "desk is" : "space is"} reserved for the
              whole day.
            </p>
          )}
        </div>

        {experience.deskBased && (
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Desks
            </Label>
            <div className="mt-2 flex items-center justify-between rounded-lg border border-border px-3 py-1.5">
              <span className="text-sm text-foreground">Number of desks</span>
              <Stepper
                value={desks}
                onChange={setDesks}
                min={1}
                max={Math.max(1, maxDesks)}
                decLabel="Decrease desks"
                incLabel="Increase desks"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {seatsLeft > 0
                ? `${seatsLeft} desk${seatsLeft > 1 ? "s" : ""} free for these dates`
                : "No desks free for these dates"}
            </p>
          </div>
        )}

        <Separator />

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>
              {formatGHS(rate.price)} × {count} {rateUnitLabel(rate.unit, count)}
              {experience.deskBased && desks > 1 ? ` × ${desks} desks` : ""}
            </span>
            <span>{formatGHS(subtotal)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-base font-semibold text-foreground">
          <span>Total</span>
          <span>{formatGHS(total)}</span>
        </div>

        <Button size="lg" onClick={handleReserve} disabled={!available} className="w-full">
          {available ? "Reserve" : "Not available for these dates"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Paying through GHBucketlist secures your workspace and confirms your full payment.
        </p>

        <Separator />

        <ShareButtons title={experience.title} />
      </div>

      <WorkspaceBookingDialog open={dialogOpen} onOpenChange={setDialogOpen} details={pending} />
    </div>
  );
}

function Stepper({
  value,
  onChange,
  min,
  max,
  decLabel,
  incLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  decLabel: string;
  incLabel: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={decLabel}
        className="flex size-7 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted disabled:opacity-40"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-4 text-center text-sm font-medium text-foreground">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={incLabel}
        className="flex size-7 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted disabled:opacity-40"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
