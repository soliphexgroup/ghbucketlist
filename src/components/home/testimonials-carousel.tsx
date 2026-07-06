"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Container } from "@/components/container";
import { StarRating } from "@/components/star-rating";
import { testimonials } from "@/data/testimonials";
import { cn } from "@/lib/utils";

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const testimonial = testimonials[index];

  function go(delta: number) {
    setIndex((prev) => (prev + delta + testimonials.length) % testimonials.length);
  }

  return (
    <section className="bg-[linear-gradient(135deg,var(--brand-primary-gradient-from),var(--brand-primary-gradient-to))] py-16 text-primary-foreground sm:py-20">
      <Container className="flex flex-col items-center">
        <Quote className="size-10 text-brand-gold" />
        <p className="mt-6 max-w-2xl text-balance text-center font-heading text-xl leading-relaxed sm:text-2xl">
          &ldquo;{testimonial.text}&rdquo;
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Image
            src={testimonial.avatarUrl}
            alt={testimonial.name}
            width={48}
            height={48}
            className="size-12 rounded-full object-cover"
          />
          <div className="text-left">
            <p className="font-semibold">{testimonial.name}</p>
            <p className="text-sm text-primary-foreground/70">{testimonial.location}</p>
          </div>
        </div>

        <StarRating rating={testimonial.rating} size="md" inverted className="mt-3" />
        <p className="mt-1 text-sm text-primary-foreground/70">{testimonial.activityName}</p>

        <div className="mt-8 flex items-center gap-4">
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={() => go(-1)}
            className="flex size-9 items-center justify-center rounded-full border border-white/30 transition-colors duration-200 hover:bg-white/10"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                type="button"
                aria-label={`Go to testimonial ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "size-2 rounded-full transition-all duration-200",
                  i === index ? "w-6 bg-white" : "bg-white/40"
                )}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={() => go(1)}
            className="flex size-9 items-center justify-center rounded-full border border-white/30 transition-colors duration-200 hover:bg-white/10"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </Container>
    </section>
  );
}
