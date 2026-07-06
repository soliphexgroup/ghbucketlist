"use client";

import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatGHS } from "@/lib/format";
import type { StoredBooking } from "@/lib/bookings-store";

export function BookingTicketModal({
  booking,
  children,
}: {
  booking: StoredBooking;
  children: React.ReactNode;
}) {
  const dateLabel = new Date(booking.dateISO).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your ticket</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-2xl border border-border bg-white p-4">
            <QRCodeSVG value={booking.reference} size={160} />
          </div>
          <p className="font-mono text-sm font-semibold tracking-wide text-foreground">
            {booking.reference}
          </p>

          <div className="w-full rounded-xl bg-secondary/50 p-4 text-left text-sm">
            <p className="font-semibold text-foreground">{booking.experienceTitle}</p>
            <p className="text-muted-foreground">
              {dateLabel} · {booking.scheduleTime}
            </p>
            <p className="text-muted-foreground">
              {booking.venueName}, {booking.neighbourhood}
            </p>
            <p className="mt-2 text-muted-foreground">
              {booking.ticketTypeName} · Qty {booking.quantity}
            </p>
            <p className="mt-2 font-medium text-foreground">{formatGHS(booking.total)} paid</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
