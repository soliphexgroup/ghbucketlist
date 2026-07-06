"use client";

import { useSyncExternalStore } from "react";
import { defaultTripTiers, type TripTierInfo } from "@/data/trip-tiers";
import type { TripTier } from "@/lib/trip-inquiries-store";

const STORAGE_KEY = "ghbucketlist:trip-pricing-overrides";
const CHANGE_EVENT = "ghbucketlist:trip-pricing-changed";

type Overrides = Partial<Record<TripTier, number>>;

let overridesCache: Overrides | null = null;
let mergedCache: TripTierInfo[] | null = null;

function readOverrides(): Overrides {
  if (typeof window === "undefined") return {};
  if (overridesCache) return overridesCache;
  try {
    overridesCache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    overridesCache = {};
  }
  return overridesCache ?? {};
}

function writeOverrides(overrides: Overrides) {
  overridesCache = overrides;
  mergedCache = null;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setTripPrice(tier: TripTier, price: number) {
  writeOverrides({ ...readOverrides(), [tier]: price });
}

function subscribe(callback: () => void) {
  function handleExternalChange() {
    overridesCache = null;
    mergedCache = null;
    callback();
  }
  window.addEventListener("storage", handleExternalChange);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleExternalChange);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getServerSnapshot(): TripTierInfo[] {
  return defaultTripTiers;
}

function getSnapshot(): TripTierInfo[] {
  if (mergedCache) return mergedCache;
  const overrides = readOverrides();
  mergedCache = defaultTripTiers.map((tier) =>
    overrides[tier.id] !== undefined ? { ...tier, price: overrides[tier.id]! } : tier
  );
  return mergedCache;
}

export function useTripTiers(): TripTierInfo[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
