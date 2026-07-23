"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useHostExperiences, useHostProperties } from "@/lib/host-repository";
import { getReviewsForExperience } from "@/data/reviews";
import { getPropertyReviews } from "@/data/property-reviews";

export default function HostReviewsPage() {
  const experiences = useHostExperiences();
  const properties = useHostProperties();
  const [listingFilter, setListingFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});

  // Reviews across both listing kinds, normalized. Keyed by kind+id so experience and
  // property review ids can't collide in the reply map or React keys.
  const allReviews = useMemo(() => {
    const fromExperiences = experiences.flatMap((e) =>
      getReviewsForExperience(e.id).map((r) => ({
        key: `exp-${r.id}`,
        listingId: e.id,
        listingTitle: e.title,
        kind: "experience" as const,
        userName: r.userName,
        userAvatar: r.userAvatar,
        rating: r.rating,
        text: r.text,
        date: r.date,
      }))
    );
    const fromProperties = properties.flatMap((p) =>
      getPropertyReviews(p.id).map((r) => ({
        key: `prop-${r.id}`,
        listingId: p.id,
        listingTitle: p.title,
        kind: "stay" as const,
        userName: r.userName,
        userAvatar: r.userAvatar,
        rating: r.rating,
        text: r.text,
        date: r.date,
      }))
    );
    return [...fromExperiences, ...fromProperties].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [experiences, properties]);

  const listings = [...experiences, ...properties];

  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allReviews.filter((r) => r.rating === star).length,
  }));

  const filtered = allReviews
    .filter((r) => (listingFilter === "all" ? true : r.listingId === listingFilter))
    .filter((r) => (ratingFilter === "all" ? true : r.rating === Number(ratingFilter)));

  function submitReply(reviewId: string) {
    const text = draft[reviewId]?.trim();
    if (!text) return;
    setReplies((prev) => ({ ...prev, [reviewId]: text }));
    setDraft((prev) => ({ ...prev, [reviewId]: "" }));
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Reviews</h1>
      <p className="mt-1 text-muted-foreground">Feedback across all of your listings.</p>

      <div className="mt-6 flex flex-col gap-1.5 rounded-2xl border border-border p-5 sm:max-w-sm">
        {breakdown.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-3">{star}</span>
            <Star className="size-3.5 fill-brand-gold text-brand-gold" />
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-gold"
                style={{ width: allReviews.length ? `${(count / allReviews.length) * 100}%` : "0%" }}
              />
            </div>
            <span className="w-4 text-right">{count}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Select value={listingFilter} onValueChange={setListingFilter}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="All listings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All listings</SelectItem>
            {listings.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r} star
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {filtered.map((review) => {
          const reply = replies[review.key];
          return (
            <div key={review.key} className="rounded-2xl border border-border p-4">
              <div className="flex gap-3">
                <Image
                  src={review.userAvatar}
                  alt={review.userName}
                  width={40}
                  height={40}
                  className="size-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.userName}</p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {review.listingTitle}
                        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium capitalize text-secondary-foreground">
                          {review.kind}
                        </span>
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={i < review.rating ? "size-3.5 fill-brand-gold text-brand-gold" : "size-3.5 text-border"}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{review.text}</p>

                  {reply ? (
                    <div className="mt-3 rounded-lg bg-secondary/50 p-3 text-sm">
                      <p className="font-medium text-foreground">Your response</p>
                      <p className="mt-0.5 text-muted-foreground">{reply}</p>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Textarea
                        value={draft[review.key] ?? ""}
                        onChange={(e) => setDraft((prev) => ({ ...prev, [review.key]: e.target.value }))}
                        placeholder="Reply to this review…"
                        rows={1}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => submitReply(review.key)} className="sm:self-start">
                        Reply
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No reviews match your filters.</p>
        )}
      </div>
    </div>
  );
}
