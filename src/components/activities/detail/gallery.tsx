"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [index, setIndex] = useState(0);

  function openAt(i: number) {
    setIndex(i);
    setLightboxOpen(true);
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:grid-rows-2">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="group relative aspect-4/3 overflow-hidden rounded-2xl sm:col-span-2 sm:row-span-2 sm:aspect-auto"
        >
          <Image
            src={images[0]}
            alt={title}
            fill
            priority
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </button>

        {images.slice(1, 5).map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => openAt(i + 1)}
            className="group relative hidden aspect-4/3 overflow-hidden rounded-2xl sm:block"
          >
            <Image
              src={src}
              alt={`${title} photo ${i + 2}`}
              fill
              sizes="25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {i === 3 && images.length > 5 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                +{images.length - 5} more
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => openAt(0)}
        className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary sm:hidden"
      >
        <Expand className="size-4" />
        View all {images.length} photos
      </button>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-4xl border-none bg-black p-0 sm:rounded-2xl"
        >
          <DialogTitle className="sr-only">{title} photos</DialogTitle>
          <div className="relative aspect-4/3 w-full sm:aspect-16/10">
            <Image
              src={images[index]}
              alt={`${title} photo ${index + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close gallery"
              className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="size-4" />
            </button>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setIndex((index - 1 + images.length) % images.length)}
                  aria-label="Previous photo"
                  className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((index + 1) % images.length)}
                  aria-label="Next photo"
                  className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <ChevronRight className="size-4" />
                </button>
              </>
            )}
          </div>
          <div className="flex justify-center gap-1.5 p-3">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-1.5 rounded-full transition-colors duration-200",
                  i === index ? "bg-white" : "bg-white/30"
                )}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
