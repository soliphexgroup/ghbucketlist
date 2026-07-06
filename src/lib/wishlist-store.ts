"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ghbucketlist:wishlist";
const CHANGE_EVENT = "ghbucketlist:wishlist-changed";
const EMPTY: string[] = [];

let cache: string[] | null = null;

export function readWishlist(): string[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache ?? EMPTY;
}

export function toggleWishlist(experienceId: string) {
  const current = readWishlist();
  const next = current.includes(experienceId)
    ? current.filter((id) => id !== experienceId)
    : [...current, experienceId];
  cache = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE_EVENT));
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

function getServerSnapshot(): string[] {
  return EMPTY;
}

export function useWishlistIds(): string[] {
  return useSyncExternalStore(subscribe, readWishlist, getServerSnapshot);
}

export function useIsWishlisted(experienceId: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => readWishlist().includes(experienceId),
    () => false
  );
}
