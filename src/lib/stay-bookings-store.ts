"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ghbucketlist:stay-bookings";
const CHANGE_EVENT = "ghbucketlist:stay-bookings-changed";
const EMPTY: StoredStayBooking[] = [];

export type StayBookingStatus = "confirmed" | "pending_request" | "declined" | "cancelled" | "completed";

export type StoredStayBooking = {
  reference: string;
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  propertyImage: string;
  hostName: string;
  neighbourhood: string;
  city: string;
  checkInISO: string;
  checkOutISO: string;
  nights: number;
  guestsAdults: number;
  guestsChildren: number;
  /** Optional: bookings saved before rooms were selectable don't carry it. */
  rooms?: number;
  nightlyRate: number;
  cleaningFee: number;
  total: number;
  bookingType: "instant" | "request";
  status: StayBookingStatus;
  createdAtISO: string;
};

let cache: StoredStayBooking[] | null = null;

function readStayBookings(): StoredStayBooking[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache ?? EMPTY;
}

function writeStayBookings(bookings: StoredStayBooking[]) {
  cache = bookings;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addStayBooking(booking: StoredStayBooking) {
  writeStayBookings([booking, ...readStayBookings()]);
}

export function cancelStayBooking(reference: string) {
  writeStayBookings(
    readStayBookings().map((b) => (b.reference === reference ? { ...b, status: "cancelled" as const } : b))
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

function getServerSnapshot(): StoredStayBooking[] {
  return EMPTY;
}

export function useStayBookings(): StoredStayBooking[] {
  return useSyncExternalStore(subscribe, readStayBookings, getServerSnapshot);
}
