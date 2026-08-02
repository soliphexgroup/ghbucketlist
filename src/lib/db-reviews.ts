"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WriteResult } from "@/lib/db-listings";
import type { ListingKind } from "@/lib/db-availability";

// Real, verified reviews. Writes go through create_review (which checks the user actually booked
// the listing). A listing's rating is computed from visible reviews (listing_ratings view) — there
// is no fabricated rating anywhere.

export type CategoryRatings = Record<string, number>;

export type DbReview = {
  id: string;
  listingId: string;
  kind: ListingKind;
  userName: string;
  userAvatar: string;
  rating: number;
  text: string;
  categoryRatings: CategoryRatings | null;
  date: string;
  status: "visible" | "hidden";
};

type Row = {
  id: string;
  listing_id: string;
  kind: string;
  user_name: string | null;
  user_avatar: string | null;
  rating: number;
  text: string;
  category_ratings: CategoryRatings | null;
  status: string;
  created_at: string;
};

const AVATAR_FALLBACK = "https://i.pravatar.cc/100?img=12";

function toReview(r: Row): DbReview {
  return {
    id: r.id,
    listingId: r.listing_id,
    kind: r.kind as ListingKind,
    userName: r.user_name ?? "Guest",
    userAvatar: r.user_avatar ?? AVATAR_FALLBACK,
    rating: r.rating,
    text: r.text,
    categoryRatings: r.category_ratings,
    date: r.created_at,
    status: (r.status as "visible" | "hidden") ?? "visible",
  };
}

const REVIEW_COLS = "id,listing_id,kind,user_name,user_avatar,rating,text,category_ratings,status,created_at";

// --- Writes ---

export type CreateReviewInput = {
  bookingReference: string;
  listingId: string;
  kind: ListingKind;
  rating: number;
  text: string;
  categoryRatings?: CategoryRatings | null;
  userName?: string | null;
  userAvatar?: string | null;
};

export async function createReview(input: CreateReviewInput): Promise<WriteResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("create_review", {
    p_booking_reference: input.bookingReference,
    p_listing_id: input.listingId,
    p_kind: input.kind,
    p_rating: input.rating,
    p_text: input.text,
    p_category_ratings: input.categoryRatings ?? null,
    p_user_name: input.userName ?? null,
    p_user_avatar: input.userAvatar ?? null,
  });
  if (error) {
    if (/already|duplicate|unique/i.test(error.message)) {
      return { ok: false, reason: "error", message: "You've already reviewed this booking." };
    }
    return { ok: false, reason: "error", message: error.message };
  }
  return { ok: true };
}

export async function updateReview(id: string, patch: { rating?: number; text?: string }): Promise<WriteResult> {
  const supabase = createClient();
  const { error } = await supabase.from("reviews").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

export async function setReviewStatus(id: string, status: "visible" | "hidden"): Promise<WriteResult> {
  const supabase = createClient();
  const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true };
}

// --- Reads ---

/** Visible reviews for one listing's detail page. */
export function useListingReviews(listingId: string | undefined): DbReview[] {
  const [reviews, setReviews] = useState<DbReview[]>([]);
  useEffect(() => {
    if (!listingId) return;
    let active = true;
    createClient()
      .from("reviews")
      .select(REVIEW_COLS)
      .eq("listing_id", listingId)
      .eq("status", "visible")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setReviews(((data ?? []) as Row[]).map(toReview));
      });
    return () => {
      active = false;
    };
  }, [listingId]);
  return reviews;
}

export type ListingRating = { rating: number; count: number };

type RatingRow = { listing_id: string; rating: number; review_count: number };

/** Computed rating + count for every reviewed listing, keyed by id. Unreviewed listings are absent. */
export function useListingRatings(): Map<string, ListingRating> {
  const [map, setMap] = useState<Map<string, ListingRating>>(new Map());
  useEffect(() => {
    let active = true;
    createClient()
      .from("listing_ratings")
      .select("listing_id,rating,review_count")
      .then(({ data }) => {
        if (!active) return;
        const m = new Map<string, ListingRating>();
        for (const r of (data ?? []) as RatingRow[]) m.set(r.listing_id, { rating: r.rating, count: r.review_count });
        setMap(m);
      });
    return () => {
      active = false;
    };
  }, []);
  return map;
}

/** Computed rating for a single listing, or null when it has no reviews yet. */
export function useListingRating(listingId: string | undefined): ListingRating | null {
  const [rating, setRating] = useState<ListingRating | null>(null);
  useEffect(() => {
    if (!listingId) return;
    let active = true;
    createClient()
      .from("listing_ratings")
      .select("rating,review_count")
      .eq("listing_id", listingId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const r = data as { rating: number; review_count: number } | null;
        setRating(r ? { rating: r.rating, count: r.review_count } : null);
      });
    return () => {
      active = false;
    };
  }, [listingId]);
  return rating;
}

/** All reviews across the platform (admin moderation). refresh() re-fetches after a change. */
export function useAdminReviews(): { reviews: DbReview[]; refresh: () => void } {
  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    createClient()
      .from("reviews")
      .select(REVIEW_COLS)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setReviews(((data ?? []) as Row[]).map(toReview));
      });
    return () => {
      active = false;
    };
  }, [tick]);
  return { reviews, refresh: () => setTick((t) => t + 1) };
}

/** Visible reviews for a set of listing ids (a host's own listings). */
export function useHostReviews(listingIds: string[]): DbReview[] {
  const [reviews, setReviews] = useState<DbReview[]>([]);
  const key = listingIds.slice().sort().join(",");
  useEffect(() => {
    if (listingIds.length === 0) {
      setReviews([]);
      return;
    }
    let active = true;
    createClient()
      .from("reviews")
      .select(REVIEW_COLS)
      .in("listing_id", listingIds)
      .eq("status", "visible")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setReviews(((data ?? []) as Row[]).map(toReview));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return reviews;
}
