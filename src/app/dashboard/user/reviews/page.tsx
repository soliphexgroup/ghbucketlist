"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditReviewDialog } from "@/components/dashboard/edit-review-dialog";
import { useMyReviews, deleteReview, canEditReview } from "@/lib/reviews-store";

export default function MyReviewsPage() {
  const reviews = useMyReviews();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">My Reviews</h1>
      <p className="mt-1 text-muted-foreground">Reviews you&apos;ve left on past experiences.</p>

      {reviews.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t left any reviews yet. Reviews can be submitted from your past
            bookings.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/user/bookings">View Past Bookings</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {reviews.map((review) => {
            const editable = canEditReview(review);
            return (
              <div
                key={review.id}
                className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row"
              >
                <Link
                  href={`/activities/${review.experienceSlug}`}
                  className="relative h-28 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-24"
                >
                  <Image
                    src={review.experienceImage}
                    alt={review.experienceTitle}
                    fill
                    className="object-cover"
                  />
                </Link>

                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link
                      href={`/activities/${review.experienceSlug}`}
                      className="font-heading text-base font-semibold text-foreground hover:text-primary"
                    >
                      {review.experienceTitle}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAtISO).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < review.rating
                            ? "size-3.5 fill-brand-gold text-brand-gold"
                            : "size-3.5 text-border"
                        }
                      />
                    ))}
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">{review.text}</p>

                  {editable && (
                    <div className="mt-3 flex gap-2">
                      <EditReviewDialog review={review}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </EditReviewDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove your review of{" "}
                              {review.experienceTitle}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep review</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteReview(review.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
