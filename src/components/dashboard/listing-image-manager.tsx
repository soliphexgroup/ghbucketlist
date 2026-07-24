"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IMAGE_ACCEPT_ATTR, uploadListingImage } from "@/lib/listing-images";
import { cn } from "@/lib/utils";

/**
 * Photo management for the host listing forms. The first image is the cover — it's what
 * the listing cards and search results show — so ordering is meaningful, not decorative.
 */
export function ListingImageManager({
  value,
  onChange,
  label = "Photos",
  hint = "The first photo is the cover shown on search results and listing cards.",
}: {
  value: string[];
  onChange: (images: string[]) => void;
  label?: string;
  hint?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [urlDraft, setUrlDraft] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setErrors([]);

    const added: string[] = [];
    const failed: string[] = [];

    for (const file of Array.from(files)) {
      const result = await uploadListingImage(file);
      if ("url" in result) added.push(result.url);
      else failed.push(result.error);
    }

    if (added.length > 0) onChange([...value, ...added]);
    setErrors(failed);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function addUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    onChange([...value, url]);
    setUrlDraft("");
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    const next = [...value];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const next = [...value];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  }

  return (
    <div>
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>

      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className={cn(
                "group relative overflow-hidden rounded-xl border",
                index === 0 ? "border-primary" : "border-border"
              )}
            >
              <div className="relative aspect-4/3 w-full bg-muted">
                {/* Remote hosts vary (Supabase, picsum, pasted URLs), so skip the optimizer. */}
                <Image src={src} alt={`Photo ${index + 1}`} fill unoptimized className="object-cover" />
              </div>

              {index === 0 && (
                <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Cover
                </span>
              )}

              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex items-center gap-0.5">
                  <IconButton label="Move left" onClick={() => move(index, -1)} disabled={index === 0}>
                    <ArrowLeft className="size-3.5" />
                  </IconButton>
                  <IconButton
                    label="Move right"
                    onClick={() => move(index, 1)}
                    disabled={index === value.length - 1}
                  >
                    <ArrowRight className="size-3.5" />
                  </IconButton>
                  <IconButton label="Set as cover" onClick={() => makeCover(index)} disabled={index === 0}>
                    <Star className="size-3.5" />
                  </IconButton>
                </div>
                <IconButton label="Remove photo" onClick={() => removeAt(index)} destructive>
                  <Trash2 className="size-3.5" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_ACCEPT_ATTR}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {uploading ? "Uploading…" : "Upload photos"}
        </Button>
        <span className="text-xs text-muted-foreground">JPEG, PNG, WebP or AVIF · up to 5MB each</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="…or paste an image URL"
            className="pl-9"
          />
        </div>
        <Button type="button" variant="outline" onClick={addUrl} disabled={!urlDraft.trim()}>
          Add URL
        </Button>
      </div>

      {errors.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {errors.map((error) => (
            <li key={error} className="text-xs text-destructive">
              {error}
            </li>
          ))}
        </ul>
      )}

      {value.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          No photos yet — we&apos;ll use stock images until you add some.
        </p>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-7 items-center justify-center rounded-md transition-colors disabled:opacity-30",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
