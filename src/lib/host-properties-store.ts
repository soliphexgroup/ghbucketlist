"use client";

import { useSyncExternalStore } from "react";
import type { Property } from "@/lib/stay-types";

const STORAGE_KEY = "ghbucketlist:host-created-properties";
const CHANGE_EVENT = "ghbucketlist:host-created-properties-changed";
const EMPTY: Property[] = [];

let cache: Property[] | null = null;

function readHostCreatedProperties(): Property[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache ?? EMPTY;
}

function writeHostCreatedProperties(list: Property[]) {
  cache = list;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addHostCreatedProperty(property: Property) {
  writeHostCreatedProperties([property, ...readHostCreatedProperties()]);
}

/** Inserts a new override entry, or replaces the existing one with the same id. */
export function upsertHostCreatedProperty(property: Property) {
  const existing = readHostCreatedProperties();
  const index = existing.findIndex((p) => p.id === property.id);
  if (index === -1) {
    writeHostCreatedProperties([property, ...existing]);
  } else {
    writeHostCreatedProperties(existing.map((p) => (p.id === property.id ? property : p)));
  }
}

export function getHostCreatedPropertyById(id: string) {
  return readHostCreatedProperties().find((p) => p.id === id);
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

function getServerSnapshot(): Property[] {
  return EMPTY;
}

export function useHostCreatedProperties(): Property[] {
  return useSyncExternalStore(subscribe, readHostCreatedProperties, getServerSnapshot);
}
