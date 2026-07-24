"use client";

import { createClient } from "@/lib/supabase/client";

// Uploads for host listing photos. Files live in Supabase Storage under
// `listing-images/<user-id>/…`; the bucket is public-read so the returned URLs can be
// rendered anywhere in the marketplace. See supabase/migration.sql for the policies.

const BUCKET = "listing-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const IMAGE_ACCEPT_ATTR = ACCEPTED.join(",");

export type UploadResult = { url: string } | { error: string };

function extensionFor(file: File) {
  const fromName = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  if (fromName) return fromName;
  return file.type.split("/")[1] ?? "jpg";
}

/**
 * Uploads one image and returns its public URL. Rejects oversized or non-image files
 * before hitting the network so the host gets an immediate, specific message.
 */
export async function uploadListingImage(file: File): Promise<UploadResult> {
  if (!ACCEPTED.includes(file.type)) {
    return { error: `${file.name}: only JPEG, PNG, WebP or AVIF images are supported.` };
  }
  if (file.size > MAX_BYTES) {
    return { error: `${file.name}: images must be under 5MB.` };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to upload photos." };
  }

  // The folder must be the user's id — the storage policy checks it.
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionFor(file)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    return { error: `${file.name}: ${error.message}` };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
