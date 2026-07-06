"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ghbucketlist:payouts";
const CHANGE_EVENT = "ghbucketlist:payouts-changed";
const EMPTY: StoredPayout[] = [];

export type PayoutStatus = "pending" | "approved" | "rejected";

export type StoredPayout = {
  id: string;
  hostId: string;
  hostName: string;
  amount: number;
  method: string;
  requestedAtISO: string;
  status: PayoutStatus;
};

let cache: StoredPayout[] | null = null;

function readPayouts(): StoredPayout[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache ?? EMPTY;
}

function writePayouts(payouts: StoredPayout[]) {
  cache = payouts;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payouts));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addPayout(payout: StoredPayout) {
  writePayouts([payout, ...readPayouts()]);
}

export function setPayoutStatus(id: string, status: PayoutStatus) {
  writePayouts(readPayouts().map((p) => (p.id === id ? { ...p, status } : p)));
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

function getServerSnapshot(): StoredPayout[] {
  return EMPTY;
}

export function usePayouts(): StoredPayout[] {
  return useSyncExternalStore(subscribe, readPayouts, getServerSnapshot);
}
