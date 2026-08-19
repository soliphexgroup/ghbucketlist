"use client";

import { createClient } from "@/lib/supabase/client";

// Uploads for host listing photos. Files live in Supabase Storage under
// `listing-images/<user-id>/…`; the bucket is public-read so the returned URLs can be
// rendered anywhere in the marketplace. See supabase/migration.sql for the policies.

const BUCKET = "listing-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// Photos are downscaled + re-encoded to WebP before upload so we never store a multi-MB original.
const MAX_DIMENSION = 1600; // longest edge, px
const WEBP_QUALITY = 0.82;
// Cache the (content-addressed) file hard: the path is unique per upload, so it never changes.
const CACHE_ONE_YEAR = "31536000";

export const IMAGE_ACCEPT_ATTR = ACCEPTED.join(",");

/**
 * Hosts allowed for a *pasted* image URL. Must stay in sync with next.config remotePatterns —
 * the image optimizer only accepts these hosts, so a URL from anywhere else would fail to render.
 * (Uploaded photos always land on Supabase, which is covered here.)
 */
const ALLOWED_URL_HOSTS = [
  "images.unsplash.com",
  "picsum.photos",
  "fastly.picsum.photos",
  "i.pravatar.cc",
];

export const ALLOWED_URL_HOSTS_HINT =
  "Paste a link from Unsplash or Picsum, or upload the photo instead.";

/** Whether a pasted image URL is from a host the optimizer can serve. */
export function isAllowedImageUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    return ALLOWED_URL_HOSTS.some((h) => url.hostname === h) || url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export type UploadResult = { url: string } | { error: string };

/**
 * Downscale to at most MAX_DIMENSION on the longest edge and re-encode as WebP. Returns the
 * original file untouched if the browser can't process it or the result isn't actually smaller.
 */
async function compressImage(file: File): Promise<{ blob: Blob; ext: string; contentType: string }> {
  const original = { blob: file, ext: file.name.split(".").pop()?.toLowerCase() || "jpg", contentType: file.type };
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") return original;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
    );
    if (!blob || blob.size >= file.size) return original;
    return { blob, ext: "webp", contentType: "image/webp" };
  } catch {
    return original;
  }
}

/**
 * Uploads one image and returns its public URL. Rejects oversized or non-image files
 * before hitting the network, then downscales/compresses so we never store a huge original.
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

  const { blob, ext, contentType } = await compressImage(file);

  // The folder must be the user's id — the storage policy checks it.
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    cacheControl: CACHE_ONE_YEAR,
    upsert: false,
    contentType,
  });

  if (error) {
    return { error: `${file.name}: ${error.message}` };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
