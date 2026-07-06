"use client";

import { useSyncExternalStore } from "react";
import type { ServiceCategory } from "@/lib/service-types";

const STORAGE_KEY = "ghbucketlist:service-requests";
const CHANGE_EVENT = "ghbucketlist:service-requests-changed";
const EMPTY: StoredServiceRequest[] = [];

export type ServiceRequestStatus = "pending" | "accepted" | "declined" | "completed" | "cancelled";

export type StoredServiceRequest = {
  reference: string;
  providerId: string;
  providerSlug: string;
  providerName: string;
  providerAvatar: string;
  category: ServiceCategory;
  jobDescription: string;
  preferredDate: string;
  address: string;
  phone: string;
  status: ServiceRequestStatus;
  createdAtISO: string;
};

let cache: StoredServiceRequest[] | null = null;

function readServiceRequests(): StoredServiceRequest[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache ?? EMPTY;
}

function writeServiceRequests(requests: StoredServiceRequest[]) {
  cache = requests;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addServiceRequest(request: StoredServiceRequest) {
  writeServiceRequests([request, ...readServiceRequests()]);
}

export function cancelServiceRequest(reference: string) {
  writeServiceRequests(
    readServiceRequests().map((r) => (r.reference === reference ? { ...r, status: "cancelled" as const } : r))
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

function getServerSnapshot(): StoredServiceRequest[] {
  return EMPTY;
}

export function useServiceRequests(): StoredServiceRequest[] {
  return useSyncExternalStore(subscribe, readServiceRequests, getServerSnapshot);
}
