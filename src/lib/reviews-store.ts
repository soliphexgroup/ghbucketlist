"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ghbucketlist:my-reviews";
const CHANGE_EVENT = "ghbucketlist:my-reviews-changed";
const EDIT_WINDOW_HOURS = 48;
const EMPTY: StoredReview[] = [];

export type StoredReview = {
  id: string;
  bookingReference: string;
  experienceId: string;
  experienceSlug: string;
  experienceTitle: string;
  experienceImage: string;
  rating: number;
  text: string;
  createdAtISO: string;
};

let cache: StoredReview[] | null = null;

function readReviews(): StoredReview[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache ?? EMPTY;
}

function writeReviews(reviews: StoredReview[]) {
  cache = reviews;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addReview(review: StoredReview) {
  writeReviews([review, ...readReviews()]);
}

export function updateReview(id: string, patch: Partial<Pick<StoredReview, "rating" | "text">>) {
  writeReviews(readReviews().map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

export function deleteReview(id: string) {
  writeReviews(readReviews().filter((r) => r.id !== id));
}

export function hasReviewed(bookingReference: string) {
  return readReviews().some((r) => r.bookingReference === bookingReference);
}

export function canEditReview(review: StoredReview) {
  const hoursSince = (Date.now() - new Date(review.createdAtISO).getTime()) / 36e5;
  return hoursSince <= EDIT_WINDOW_HOURS;
}

function subscribe(callback: () => void) {
  function handleExternalChange() {
    cache = null;
    callback();
  }
  window.addEventListener("storage", handleExternalChange);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleExternalChange);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getServerSnapshot(): StoredReview[] {
  return EMPTY;
}

export function useMyReviews(): StoredReview[] {
  return useSyncExternalStore(subscribe, readReviews, getServerSnapshot);
}
