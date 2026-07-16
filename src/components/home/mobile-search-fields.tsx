"use client";

import { useState } from "react";
import { Minus, Plus, type LucideIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Shared building blocks for the stacked mobile search boxes in the hero.
// Each vertical composes these so the four boxes stay visually identical.

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfToday() {
  return new Date(new Date().setHours(0, 0, 0, 0));
}

/** "Fri 10 Jul 2026" — en-GB renders "Fri, 10 Jul 2026", so drop the comma. */
export function formatLong(date: Date) {
  return date
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(",", "");
}

export function MobileSearchShell({
  onSubmit,
  children,
}: {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-1.5 rounded-xl bg-search-accent p-1.5 shadow-2xl"
    >
      {children}
    </form>
  );
}

export function MobileSearchSubmit() {
  return (
    <button
      type="submit"
      className="w-full rounded-md bg-search-button py-4 text-base font-bold text-search-button-foreground transition-colors duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      Search
    </button>
  );
}

export function MobileTextField({
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-md bg-white px-4 py-4">
      <Icon className="size-5 shrink-0 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent text-base font-bold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
      />
    </div>
  );
}

export function MobileDateField({
  label,
  date,
  onSelect,
  disabled,
}: {
  label: string;
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex flex-col gap-1 rounded-md bg-white px-4 py-3 text-left">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="truncate text-base font-bold text-foreground">
            {date ? formatLong(date) : "Select date"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          // Without this the calendar opens on the current month, even when the
          // selected date is months away.
          defaultMonth={date}
          onSelect={(next) => {
            onSelect(next);
            setOpen(false);
          }}
          disabled={disabled}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function MobileCounterField({
  label,
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="flex flex-col gap-1 rounded-md bg-white px-4 py-3 text-left">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-base font-bold text-foreground">{value}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="start">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <div className="flex items-center gap-4 rounded-md border border-border px-3 py-2">
            <button
              type="button"
              onClick={() => onChange(Math.max(min, value - 1))}
              disabled={value <= min}
              aria-label={`Decrease ${label}`}
              className="text-primary disabled:opacity-30"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-4 text-center text-sm font-medium text-foreground">{value}</span>
            <button
              type="button"
              onClick={() => onChange(Math.min(max, value + 1))}
              disabled={value >= max}
              aria-label={`Increase ${label}`}
              className="text-primary disabled:opacity-30"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
