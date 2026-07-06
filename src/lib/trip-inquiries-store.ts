"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ghbucketlist:trip-inquiries";
const CHANGE_EVENT = "ghbucketlist:trip-inquiries-changed";
const EMPTY: TripInquiry[] = [];

export type TripTier = "essentials" | "standard" | "premium";
export type InquiryStatus = "new" | "in_progress" | "completed" | "declined";

export type TripInquiry = {
  id: string;
  name: string;
  email: string;
  tier: TripTier;
  travelDates: string;
  travelInterests: string;
  message: string;
  status: InquiryStatus;
  createdAtISO: string;
};

let cache: TripInquiry[] | null = null;

function readInquiries(): TripInquiry[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache ?? EMPTY;
}

function writeInquiries(inquiries: TripInquiry[]) {
  cache = inquiries;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inquiries));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addTripInquiry(inquiry: TripInquiry) {
  writeInquiries([inquiry, ...readInquiries()]);
}

export function setInquiryStatus(id: string, status: InquiryStatus) {
  writeInquiries(readInquiries().map((i) => (i.id === id ? { ...i, status } : i)));
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

function getServerSnapshot(): TripInquiry[] {
  return EMPTY;
}

export function useTripInquiries(): TripInquiry[] {
  return useSyncExternalStore(subscribe, readInquiries, getServerSnapshot);
}
