"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ghbucketlist:car-bookings";
const CHANGE_EVENT = "ghbucketlist:car-bookings-changed";
const EMPTY: StoredCarBooking[] = [];

export type CarBookingStatus = "confirmed" | "pending_request" | "declined" | "cancelled" | "completed";

export type StoredCarBooking = {
  reference: string;
  carId: string;
  carSlug: string;
  carTitle: string;
  carImage: string;
  vendorName: string;
  pickupLocation: string;
  city: string;
  pickupDateISO: string;
  returnDateISO: string;
  days: number;
  withDriver: boolean;
  dailyRate: number;
  total: number;
  bookingType: "instant" | "request";
  status: CarBookingStatus;
  createdAtISO: string;
};

let cache: StoredCarBooking[] | null = null;

function readCarBookings(): StoredCarBooking[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache ?? EMPTY;
}

function writeCarBookings(bookings: StoredCarBooking[]) {
  cache = bookings;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addCarBooking(booking: StoredCarBooking) {
  writeCarBookings([booking, ...readCarBookings()]);
}

export function cancelCarBooking(reference: string) {
  writeCarBookings(
    readCarBookings().map((b) => (b.reference === reference ? { ...b, status: "cancelled" as const } : b))
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

function getServerSnapshot(): StoredCarBooking[] {
  return EMPTY;
}

export function useCarBookings(): StoredCarBooking[] {
  return useSyncExternalStore(subscribe, readCarBookings, getServerSnapshot);
}
