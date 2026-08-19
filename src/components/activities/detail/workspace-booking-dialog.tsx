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
import { paystackReference } from "@/lib/paystack";
import { createDbBooking } from "@/lib/db-bookings";
import { notifyBooking } from "@/lib/email/notify";
import { toISODate } from "@/lib/availability";
import { useAuth } from "@/lib/auth-context";
import { rateUnitLabel } from "@/lib/workspace-rates";
import type { Experience, WorkspaceRate } from "@/lib/types";

export type WorkspaceBookingDetails = {
  experience: Experience;
  rate: WorkspaceRate;
  /** Number of rate units (e.g. 3 days, 2 months). */
  count: number;
  /** Desks reserved (1 for whole-room listings). */
  desks: number;
  start: Date;
  end: Date; // end-exclusive
  subtotal: number;
  serviceFee: number;
  total: number;
};

export function WorkspaceBookingDialog({
  open,
  onOpenChange,
  details,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: WorkspaceBookingDetails | null;
}) {
  const [stage, setStage] = useState<"summary" | "processing" | "confirmed" | "failed" | "signin">(
    "summary"
  );
  const [reference, setReference] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const checkout = usePaystackCheckout();
  const { user } = useAuth();

  if (!details) return null;

  const canPay = payerEmail.includes("@") && payerEmail.includes(".");
  const durationLabel = `${details.count} ${rateUnitLabel(details.rate.unit, details.count)}`;
  const deskLabel = details.experience.deskBased
    ? ` · ${details.desks} desk${details.desks > 1 ? "s" : ""}`
    : "";

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setStage("summary");
        setErrorMessage("");
      }, 200);
    }
  }

  // Reserve the desks over the span via the availability-checked RPC. A real booking holds the
  // seats for everyone, so if the space just filled for the range the reserve fails cleanly.
  async function reserveInDb(ref: string, d: WorkspaceBookingDetails) {
    return createDbBooking({
      reference: ref,
      paymentReference: ref,
      requestOnly: false,
      kind: "experience",
      listingId: d.experience.id,
      unitKey: "",
      start: toISODate(d.start),
      end: toISODate(d.end),
      units: d.desks,
      guests: d.desks,
      total: d.total,
      guestName: payerEmail || undefined,
      guestEmail: payerEmail || undefined,
      details: {
        requestOnly: false,
        workspaceRateUnit: d.rate.unit,
        workspaceCount: d.count,
      },
    });
  }

  async function handlePay() {
    const d = details;
    if (!d) return;
    if (d.total > 0 && !canPay) return;

    if (!user) {
      setStage("signin");
      return;
    }

    setStage("processing");

    let bookingReference: string;
    if (d.total > 0) {
      const result = await checkout({
        email: payerEmail,
        amountGHS: d.total,
        metadata: { experienceId: d.experience.id, kind: "workspace_booking" },
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
      bookingReference = result.reference;
    } else {
      bookingReference = paystackReference();
    }

    const reserved = await reserveInDb(bookingReference, d);
    if (!reserved.ok) {
      setErrorMessage(
        reserved.message ?? "This space was just booked for those dates. You have not been charged."
      );
      setStage("failed");
      return;
    }
    void notifyBooking(bookingReference);

    const category = getExperienceCategory(d.experience);
    const host = getExperienceHost(d.experience);
    addBooking({
      reference: bookingReference,
      experienceId: d.experience.id,
      experienceSlug: d.experience.slug,
      experienceTitle: d.experience.title,
      experienceImage: d.experience.images[0],
      hostName: host?.name ?? "",
      venueName: d.experience.venueName,
      neighbourhood: d.experience.neighbourhood,
      categoryName: category?.name ?? "",
      dateISO: d.start.toISOString(),
      scheduleTime: "",
      durationMinutes: 0,
      ticketTypeName: `${durationLabel}${deskLabel}`,
      quantity: d.desks,
      total: d.total,
      gpEarned: 0,
      gpRedeemed: 0,
      discountApplied: 0,
      isGift: false,
      status: "confirmed",
      createdAtISO: new Date().toISOString(),
    });
    setReference(bookingReference);
    setStage("confirmed");
  }

  const startLabel = details.start.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  // The stored end is checkout-exclusive; show the last occupied day (end − 1) to the guest.
  const lastDay = new Date(details.end.getTime() - 86_400_000);
  const endLabel = lastDay.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {(stage === "summary" || stage === "processing") && (
          <DialogHeader>
            <DialogTitle>Confirm your workspace booking</DialogTitle>
          </DialogHeader>
        )}

        {stage === "summary" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-heading text-base font-semibold text-foreground">
                {details.experience.title}
              </p>
              <p className="text-sm text-muted-foreground">{details.experience.venueName}</p>
            </div>

            <Separator />

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-medium text-foreground">
                  {formatGHS(details.rate.price)} / {rateUnitLabel(details.rate.unit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium text-foreground">{durationLabel}</span>
              </div>
              {details.experience.deskBased && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desks</span>
                  <span className="font-medium text-foreground">{details.desks}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dates</span>
                <span className="font-medium text-foreground">
                  {startLabel} → {endLabel}
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatGHS(details.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Service fee</span>
                <span>{formatGHS(details.serviceFee)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatGHS(details.total)}</span>
              </div>
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
              You&apos;ll be securely redirected to Paystack to complete payment by card or mobile
              money.
            </p>

            <DialogFooter className="-mx-4 -mb-4 mt-2">
              <Button
                onClick={handlePay}
                disabled={details.total > 0 && !canPay}
                className="w-full sm:w-auto"
              >
                Pay {formatGHS(details.total)}
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

        {stage === "signin" && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Sign in to book</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Bookings are tied to your account so you can manage them and we can hold your desks.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href={`/login?next=/activities/${details.experience.slug}`}>
                Sign in to continue
              </Link>
            </Button>
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
              <p className="font-heading text-lg font-semibold text-foreground">Booking confirmed</p>
              <p className="text-sm text-muted-foreground">
                Your QR pass is ready. We&apos;ve also emailed a copy to you.
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
              <p className="text-muted-foreground">{details.experience.venueName}</p>
              <p className="mt-2 text-muted-foreground">
                {startLabel} → {endLabel}
              </p>
              <p className="text-muted-foreground">
                {durationLabel}
                {deskLabel}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2">
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/user/bookings" onClick={() => handleOpenChange(false)}>
                  View in My Bookings
                </Link>
              </Button>
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
