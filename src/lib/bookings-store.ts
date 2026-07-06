"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ghbucketlist:bookings";
const CHANGE_EVENT = "ghbucketlist:bookings-changed";
const EMPTY: StoredBooking[] = [];

export type BookingStatus = "confirmed" | "attended" | "cancelled";

export type StoredBooking = {
  reference: string;
  experienceId: string;
  experienceSlug: string;
  experienceTitle: string;
  experienceImage: string;
  hostName: string;
  venueName: string;
  neighbourhood: string;
  categoryName: string;
  dateISO: string;
  scheduleTime: string;
  durationMinutes: number;
  ticketTypeName: string;
  quantity: number;
  total: number;
  gpEarned: number;
  gpRedeemed: number;
  discountApplied: number;
  isGift: boolean;
  recipientEmail?: string;
  giftMessage?: string;
  status: BookingStatus;
  createdAtISO: string;
};

let cache: StoredBooking[] | null = null;

function readBookings(): StoredBooking[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache ?? EMPTY;
}

function writeBookings(bookings: StoredBooking[]) {
  cache = bookings;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addBooking(booking: StoredBooking) {
  writeBookings([booking, ...readBookings()]);
}

export function cancelBooking(reference: string) {
  writeBookings(
    readBookings().map((b) =>
      b.reference === reference ? { ...b, status: "cancelled" as const } : b
    )
  );
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

function getServerSnapshot(): StoredBooking[] {
  return EMPTY;
}

export function useBookings(): StoredBooking[] {
  return useSyncExternalStore(subscribe, readBookings, getServerSnapshot);
}

export function isUpcoming(booking: StoredBooking, now: Date) {
  return booking.status !== "cancelled" && new Date(booking.dateISO) >= now;
}

export function isPast(booking: StoredBooking, now: Date) {
  return booking.status !== "cancelled" && new Date(booking.dateISO) < now;
}
