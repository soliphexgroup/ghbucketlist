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
import { updateReview } from "@/lib/reviews-store";
import { cn } from "@/lib/utils";
import type { StoredReview } from "@/lib/reviews-store";

export function EditReviewDialog({
  review,
  children,
}: {
  review: StoredReview;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState(review.text);

  function handleSave() {
    if (text.trim().length < 20) return;
    updateReview(review.id, { rating, text: text.trim() });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit review</DialogTitle>
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

          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} />
        </div>

        <DialogFooter className="-mx-4 -mb-4 mt-2">
          <Button onClick={handleSave} disabled={text.trim().length < 20} className="w-full sm:w-auto">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
