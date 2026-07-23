"use client";

import { useSyncExternalStore } from "react";
import type { Car } from "@/lib/car-types";

const STORAGE_KEY = "ghbucketlist:host-created-cars";
const CHANGE_EVENT = "ghbucketlist:host-created-cars-changed";
const EMPTY: Car[] = [];

let cache: Car[] | null = null;

function readHostCreatedCars(): Car[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache ?? EMPTY;
}

function writeHostCreatedCars(list: Car[]) {
  cache = list;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addHostCreatedCar(car: Car) {
  writeHostCreatedCars([car, ...readHostCreatedCars()]);
}

/** Inserts a new override entry, or replaces the existing one with the same id. */
export function upsertHostCreatedCar(car: Car) {
  const existing = readHostCreatedCars();
  const index = existing.findIndex((c) => c.id === car.id);
  if (index === -1) {
    writeHostCreatedCars([car, ...existing]);
  } else {
    writeHostCreatedCars(existing.map((c) => (c.id === car.id ? car : c)));
  }
}

export function getHostCreatedCarById(id: string) {
  return readHostCreatedCars().find((c) => c.id === id);
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

function getServerSnapshot(): Car[] {
  return EMPTY;
}

export function useHostCreatedCars(): Car[] {
  return useSyncExternalStore(subscribe, readHostCreatedCars, getServerSnapshot);
}
