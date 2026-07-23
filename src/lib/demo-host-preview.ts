"use client";

import { useSyncExternalStore } from "react";

// A demo affordance: view the host dashboard as the seeded demo host (Kwabena Mensah)
// without signing in, so the mock listings/bookings/reviews are visible. It only ever
// surfaces fictional demo data, never anything real. Toggle it by visiting the dashboard
// with ?preview=1, and clear it with the Exit button.

const STORAGE_KEY = "ghbucketlist:demo-host-preview";
const CHANGE_EVENT = "ghbucketlist:demo-host-preview-changed";
/** Also mirrored to a cookie so the auth middleware can let the preview through. */
export const PREVIEW_COOKIE = "demo-host-preview";

function read(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function setDemoHostPreview(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) {
    window.localStorage.setItem(STORAGE_KEY, "1");
    document.cookie = `${PREVIEW_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
    document.cookie = `${PREVIEW_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useDemoHostPreview(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
