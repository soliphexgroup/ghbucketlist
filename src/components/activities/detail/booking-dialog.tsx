"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatGHS } from "@/lib/format";
import { addBooking } from "@/lib/bookings-store";
import { getExperienceCategory, getExperienceHost } from "@/lib/repository";
import { usePaystackCheckout } from "@/hooks/use-paystack-checkout";
import type { Experience, TicketType } from "@/lib/types";

export type BookingDetails = {
  experience: Experience;
  ticketType: TicketType;
  quantity: number;
  date: Date;
  total: number;
  gpEarned: number;
  gpRedeemed: number;
  discount: number;
  isGift: boolean;
  recipientEmail?: string;
};

export function BookingDialog({
  open,
  onOpenChange,
  details,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: BookingDetails | null;
}) {
  const [stage, setStage] = useState<"summary" | "processing" | "confirmed" | "failed">("summary");
  const [reference, setReference] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const checkout = usePaystackCheckout();

  if (!details) return null;

  const canPay = payerEmail.includes("@") && payerEmail.includes(".");

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setStage("summary");
        setErrorMessage("");
      }, 200);
    }
  }

  async function handlePay() {
    const bookingDetails = details;
    if (!bookingDetails || !canPay) return;
    setStage("processing");

    const result = await checkout({
      email: payerEmail,
      amountGHS: bookingDetails.total,
      metadata: { experienceId: bookingDetails.experience.id, kind: "activity_booking" },
    });

    if (!result.success) {
      if (result.reason === "cancelled") {
        setStage("summary");
        return;
      }
      setErrorMessage(result.message ?? "Payment could not be completed. Please try again.");
      setStage("failed");
      return;
    }

    const category = getExperienceCategory(bookingDetails.experience);
    const host = getExperienceHost(bookingDetails.experience);
    addBooking({
      reference: result.reference,
      experienceId: bookingDetails.experience.id,
      experienceSlug: bookingDetails.experience.slug,
      experienceTitle: bookingDetails.experience.title,
      experienceImage: bookingDetails.experience.images[0],
      hostName: host?.name ?? "",
      venueName: bookingDetails.experience.venueName,
      neighbourhood: bookingDetails.experience.neighbourhood,
      categoryName: category?.name ?? "",
      dateISO: bookingDetails.date.toISOString(),
      scheduleTime: bookingDetails.experience.scheduleTime,
      durationMinutes: bookingDetails.experience.durationMinutes,
      ticketTypeName: bookingDetails.ticketType.name,
      quantity: bookingDetails.quantity,
      total: bookingDetails.total,
      gpEarned: bookingDetails.gpEarned,
      gpRedeemed: bookingDetails.gpRedeemed,
      discountApplied: bookingDetails.discount,
      isGift: bookingDetails.isGift,
      recipientEmail: bookingDetails.recipientEmail,
      status: "confirmed",
      createdAtISO: new Date().toISOString(),
    });
    setReference(result.reference);
    setStage("confirmed");
  }

  const dateLabel = details.date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {(stage === "summary" || stage === "processing") && (
          <DialogHeader>
            <DialogTitle>
              {details.isGift ? "Gift this experience" : "Confirm your booking"}
            </DialogTitle>
          </DialogHeader>
        )}

        {stage === "summary" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-heading text-base font-semibold text-foreground">
                {details.experience.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {dateLabel} · {details.experience.scheduleTime}
              </p>
              <p className="text-sm text-muted-foreground">{details.experience.venueName}</p>
            </div>

            <Separator />

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket type</span>
                <span className="font-medium text-foreground">{details.ticketType.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium text-foreground">{details.quantity}</span>
              </div>
              {details.isGift && details.recipientEmail && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-medium text-foreground">{details.recipientEmail}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">GP you&apos;ll earn</span>
                <span className="font-medium text-foreground">{details.gpEarned} GP</span>
              </div>
              {details.gpRedeemed > 0 && (
                <div className="flex justify-between text-success">
                  <span>GP redeemed</span>
                  <span>-{details.gpRedeemed} GP ({formatGHS(details.discount)})</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between text-base font-semibold text-foreground">
              <span>Total</span>
              <span>{formatGHS(details.total)}</span>
            </div>

            {details.total > 0 && (
              <div>
                <Label htmlFor="payer-email" className="text-xs text-muted-foreground">
                  Email for receipt
                </Label>
                <Input
                  id="payer-email"
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="mt-1.5"
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {details.total > 0
                ? "You'll be securely redirected to Paystack to complete payment by card or mobile money."
                : "This experience is free — no payment required."}
            </p>

            <DialogFooter className="-mx-4 -mb-4 mt-2">
              <Button onClick={handlePay} disabled={details.total > 0 && !canPay} className="w-full sm:w-auto">
                {details.total > 0 ? `Pay ${formatGHS(details.total)}` : "Confirm Booking"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage === "processing" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Waiting for Paystack…</p>
          </div>
        )}

        {stage === "failed" && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <XCircle className="size-10 text-destructive" />
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Payment failed</p>
              <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
            </div>
            <Button className="w-full" onClick={() => setStage("summary")}>
              Try again
            </Button>
          </div>
        )}

        {stage === "confirmed" && (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <CheckCircle2 className="size-10 text-success" />
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">
                {details.isGift ? "Gift sent!" : "Booking confirmed"}
              </p>
              <p className="text-sm text-muted-foreground">
                {details.isGift
                  ? `We've emailed a redemption link to ${details.recipientEmail}.`
                  : "Your QR ticket is ready. We've also emailed a copy to you."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-4">
              <QRCodeSVG value={reference} size={160} />
            </div>

            <p className="font-mono text-sm font-semibold tracking-wide text-foreground">
              {reference}
            </p>

            <div className="w-full rounded-xl bg-secondary/50 p-4 text-left text-sm">
              <p className="font-semibold text-foreground">{details.experience.title}</p>
              <p className="text-muted-foreground">
                {dateLabel} · {details.experience.scheduleTime}
              </p>
              <p className="text-muted-foreground">{details.experience.venueName}</p>
              <p className="mt-2 text-muted-foreground">
                {details.ticketType.name} · Qty {details.quantity}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2">
              {!details.isGift && (
                <Button variant="outline" asChild className="w-full">
                  <Link href="/dashboard/user/bookings" onClick={() => handleOpenChange(false)}>
                    View in My Bookings
                  </Link>
                </Button>
              )}
              <Button className="w-full" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
