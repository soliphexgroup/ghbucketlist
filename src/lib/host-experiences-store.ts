"use client";

import { useSyncExternalStore } from "react";
import type { Experience } from "@/lib/types";

const STORAGE_KEY = "ghbucketlist:host-created-experiences";
const CHANGE_EVENT = "ghbucketlist:host-created-experiences-changed";
const EMPTY: Experience[] = [];

let cache: Experience[] | null = null;

function readHostCreatedExperiences(): Experience[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache ?? EMPTY;
}

function writeHostCreatedExperiences(list: Experience[]) {
  cache = list;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addHostCreatedExperience(experience: Experience) {
  writeHostCreatedExperiences([experience, ...readHostCreatedExperiences()]);
}

export function updateHostCreatedExperience(id: string, patch: Partial<Experience>) {
  writeHostCreatedExperiences(
    readHostCreatedExperiences().map((e) => (e.id === id ? { ...e, ...patch } : e))
  );
}

/** Inserts a new override entry, or replaces the existing one with the same id. */
export function upsertHostCreatedExperience(experience: Experience) {
  const existing = readHostCreatedExperiences();
  const index = existing.findIndex((e) => e.id === experience.id);
  if (index === -1) {
    writeHostCreatedExperiences([experience, ...existing]);
  } else {
    writeHostCreatedExperiences(existing.map((e) => (e.id === experience.id ? experience : e)));
  }
}

export function getHostCreatedExperienceById(id: string) {
  return readHostCreatedExperiences().find((e) => e.id === id);
}

export function getHostCreatedExperienceBySlug(slug: string) {
  return readHostCreatedExperiences().find((e) => e.slug === slug);
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

function getServerSnapshot(): Experience[] {
  return EMPTY;
}

export function useHostCreatedExperiences(): Experience[] {
  return useSyncExternalStore(subscribe, readHostCreatedExperiences, getServerSnapshot);
}
