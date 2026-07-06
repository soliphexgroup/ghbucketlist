"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addReview } from "@/lib/reviews-store";
import { cn } from "@/lib/utils";
import type { StoredBooking } from "@/lib/bookings-store";

export function WriteReviewDialog({
  booking,
  children,
}: {
  booking: StoredBooking;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");

  function handleSubmit() {
    if (text.trim().length < 20) return;
    addReview({
      id: crypto.randomUUID(),
      bookingReference: booking.reference,
      experienceId: booking.experienceId,
      experienceSlug: booking.experienceSlug,
      experienceTitle: booking.experienceTitle,
      experienceImage: booking.experienceImage,
      rating,
      text: text.trim(),
      createdAtISO: new Date().toISOString(),
    });
    setOpen(false);
    setText("");
    setRating(5);
  }

  const canSubmit = text.trim().length >= 20;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review {booking.experienceTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      "size-7 transition-colors duration-150",
                      value <= (hoverRating || rating)
                        ? "fill-brand-gold text-brand-gold"
                        : "text-border"
                    )}
                  />
                </button>
              );
            })}
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share details of your experience (minimum 20 characters)…"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {text.trim().length}/20 characters minimum · Earn +5 GP for submitting a review
          </p>
        </div>

        <DialogFooter className="-mx-4 -mb-4 mt-2">
          <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full sm:w-auto">
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
