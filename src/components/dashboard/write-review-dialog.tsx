"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
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
import { createReview } from "@/lib/db-reviews";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type { ListingKind } from "@/lib/db-availability";

/**
 * Verified review dialog for any booked listing. Writes to the DB via create_review (which checks
 * the user actually booked it) and mirrors to localStorage so GP + "already reviewed" keep working.
 */
export function WriteReviewDialog({
  bookingReference,
  listingId,
  kind,
  listingTitle,
  listingImage,
  listingSlug = "",
  children,
}: {
  bookingReference: string;
  listingId: string;
  kind: ListingKind;
  listingTitle: string;
  listingImage: string;
  listingSlug?: string;
  children: React.ReactNode;
}) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = text.trim().length >= 20;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await createReview({
      bookingReference,
      listingId,
      kind,
      rating,
      text: text.trim(),
      userName: profile?.full_name ?? user?.email ?? null,
      userAvatar: profile?.avatar_url ?? null,
    });
    if (!res.ok) {
      setSubmitting(false);
      setError(res.message);
      return;
    }
    // Mirror to localStorage so GP balance + the "Reviewed" state stay consistent.
    addReview({
      id: crypto.randomUUID(),
      bookingReference,
      experienceId: listingId,
      experienceSlug: listingSlug,
      experienceTitle: listingTitle,
      experienceImage: listingImage,
      rating,
      text: text.trim(),
      createdAtISO: new Date().toISOString(),
    });
    setSubmitting(false);
    setOpen(false);
    setText("");
    setRating(5);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review {listingTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

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
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="w-full gap-2 sm:w-auto">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
