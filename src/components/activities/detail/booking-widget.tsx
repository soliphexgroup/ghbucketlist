"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, Gift, Minus, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { WishlistButton } from "@/components/wishlist-button";
import { ShareButtons } from "@/components/activities/detail/share-buttons";
import { BookingDialog, type BookingDetails } from "@/components/activities/detail/booking-dialog";
import { formatDuration, formatGHS } from "@/lib/format";
import { useBookings } from "@/lib/bookings-store";
import { useMyReviews } from "@/lib/reviews-store";
import { computeGpBalance, gpToDiscount, maxRedeemableGp } from "@/lib/gp";
import type { Experience } from "@/lib/types";
import { getPriceFrom } from "@/data/experiences";

const DAY_NAME_TO_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function nextAvailableDate(scheduleDays: string[]) {
  const allowed = scheduleDays.map((d) => DAY_NAME_TO_INDEX[d]);
  const date = new Date();
  for (let i = 0; i < 14; i++) {
    if (allowed.includes(date.getDay())) return date;
    date.setDate(date.getDate() + 1);
  }
  return new Date();
}

export function BookingWidget({ experience }: { experience: Experience }) {
  const allowedDays = useMemo(
    () => experience.scheduleDays.map((d) => DAY_NAME_TO_INDEX[d]),
    [experience.scheduleDays]
  );
  const [date, setDate] = useState<Date>(() => nextAvailableDate(experience.scheduleDays));
  const [ticketTypeId, setTicketTypeId] = useState(experience.ticketTypes[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [isGift, setIsGift] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<BookingDetails | null>(null);
  const [redeemPoints, setRedeemPoints] = useState(false);

  const bookings = useBookings();
  const reviews = useMyReviews();
  const gpBalance = computeGpBalance(bookings, reviews);

  const ticketType =
    experience.ticketTypes.find((t) => t.id === ticketTypeId) ?? experience.ticketTypes[0];
  const subtotal = (ticketType?.priceGHS ?? 0) * quantity;
  const redeemableGp = maxRedeemableGp(gpBalance, subtotal);
  const canRedeem = redeemableGp > 0;
  const gpRedeemed = redeemPoints && canRedeem ? redeemableGp : 0;
  const discount = gpToDiscount(gpRedeemed);
  const total = subtotal - discount;
  const gpEarned = experience.gpPoints * quantity;
  const priceFrom = getPriceFrom(experience);
  const canBook = !isGift || recipientEmail.trim().length > 3;

  function handleBook() {
    if (!ticketType) return;
    setPendingBooking({
      experience,
      ticketType,
      quantity,
      date,
      total,
      gpEarned,
      gpRedeemed,
      discount,
      isGift,
      recipientEmail: isGift ? recipientEmail : undefined,
    });
    setDialogOpen(true);
  }

  return (
    <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
      <div className="flex items-baseline justify-between">
        <p className="font-heading text-2xl font-bold text-foreground">
          {formatGHS(priceFrom)}
          {priceFrom > 0 && <span className="text-sm font-normal text-muted-foreground"> / person</span>}
        </p>
        <WishlistButton
          experienceId={experience.id}
          className="static bg-secondary hover:bg-secondary"
        />
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="mt-2 w-full justify-start gap-2 font-normal"
              >
                <CalendarIcon className="size-4" />
                {date.toLocaleDateString("en-GB", {
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
                selected={date}
                onSelect={(d) => d && setDate(d)}
                disabled={(d) =>
                  d < new Date(new Date().setHours(0, 0, 0, 0)) || !allowedDays.includes(d.getDay())
                }
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Time
            </Label>
            <p className="mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
              {experience.scheduleTime}
            </p>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Duration
            </Label>
            <p className="mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
              {formatDuration(experience.durationMinutes)}
            </p>
          </div>
        </div>

        {experience.ticketTypes.length > 1 && (
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ticket type
            </Label>
            <RadioGroup
              value={ticketTypeId}
              onValueChange={setTicketTypeId}
              className="mt-2 flex flex-col gap-2"
            >
              {experience.ticketTypes.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
                >
                  <span className="flex items-center gap-2">
                    <RadioGroupItem value={t.id} />
                    {t.name}
                  </span>
                  <span className="font-medium text-foreground">{formatGHS(t.priceGHS)}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
        )}

        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Guests
          </Label>
          <div className="mt-2 flex items-center justify-between rounded-lg border border-border px-3 py-1.5">
            <span className="text-sm text-foreground">Number of people</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex size-7 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted disabled:opacity-40"
                disabled={quantity <= 1}
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-4 text-center text-sm font-medium text-foreground">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(experience.maxCapacity, q + 1))}
                aria-label="Increase quantity"
                className="flex size-7 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted disabled:opacity-40"
                disabled={quantity >= experience.maxCapacity}
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2.5 text-sm">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Earn up to {gpEarned} GP
          </span>
        </div>

        {gpBalance >= 100 && (
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <label htmlFor="redeem-toggle" className="text-sm font-medium text-foreground">
                Redeem points
              </label>
              <p className="text-xs text-muted-foreground">
                {canRedeem
                  ? `Use ${redeemableGp} GP for ${formatGHS(gpToDiscount(redeemableGp))} off`
                  : `You have ${gpBalance} GP available`}
              </p>
            </div>
            <Switch
              id="redeem-toggle"
              checked={redeemPoints}
              onCheckedChange={setRedeemPoints}
              disabled={!canRedeem}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <label htmlFor="gift-toggle" className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Gift className="size-4" />
            Gift this experience
          </label>
          <Switch id="gift-toggle" checked={isGift} onCheckedChange={setIsGift} />
        </div>

        {isGift && (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3">
            <div>
              <Label htmlFor="recipient-email" className="text-xs text-muted-foreground">
                Recipient email
              </Label>
              <Input
                id="recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="friend@email.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gift-message" className="text-xs text-muted-foreground">
                Gift message (optional)
              </Label>
              <Textarea
                id="gift-message"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Enjoy this on me!"
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
        )}

        <Separator />

        {discount > 0 && (
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatGHS(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-success">
              <span>GP discount ({gpRedeemed} GP)</span>
              <span>-{formatGHS(discount)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-base font-semibold text-foreground">
          <span>Total</span>
          <span>{formatGHS(total)}</span>
        </div>

        <Button
          size="lg"
          onClick={handleBook}
          disabled={!canBook || !ticketType}
          className="w-full"
        >
          {isGift ? "Gift Now" : "Book Now"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Paying through GH Bucketlist secures your booking and confirms your full payment. You
          won&apos;t be required to make any additional payments at the venue.
        </p>

        <Separator />

        <ShareButtons title={experience.title} />
      </div>

      <BookingDialog open={dialogOpen} onOpenChange={setDialogOpen} details={pendingBooking} />
    </div>
  );
}
