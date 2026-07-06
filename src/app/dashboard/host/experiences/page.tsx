"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Copy, Pause, Play, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StarRating } from "@/components/star-rating";
import { useHostExperiences, useHostBookings } from "@/lib/host-repository";
import { getPriceFrom } from "@/data/experiences";
import { formatGHS } from "@/lib/format";

export default function MyExperiencesPage() {
  const experiences = useHostExperiences();
  const bookings = useHostBookings();
  const [pausedIds, setPausedIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  function togglePause(id: string) {
    setPausedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visible = experiences.filter((e) => !deletedIds.has(e.id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">My Experiences</h1>
          <p className="mt-1 text-muted-foreground">Manage your listings and their status.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/host/experiences/new">
            <Plus className="size-4" />
            Add New Experience
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {visible.map((experience) => {
          const isPaused = pausedIds.has(experience.id);
          const bookingCount = bookings.filter((b) => b.experienceId === experience.id).length;

          return (
            <div
              key={experience.id}
              className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-center"
            >
              <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-28">
                <Image src={experience.images[0]} alt={experience.title} fill className="object-cover" />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/activities/${experience.slug}`}
                    className="font-heading font-semibold text-foreground hover:text-primary"
                  >
                    {experience.title}
                  </Link>
                  <Badge variant={isPaused ? "outline" : "default"}>
                    {isPaused ? "Paused" : "Active"}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>{formatGHS(getPriceFrom(experience))}</span>
                  <span>{bookingCount} bookings</span>
                  <StarRating rating={experience.rating} reviewCount={experience.reviewCount} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/host/experiences/new?edit=${experience.id}`}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => togglePause(experience.id)}>
                  {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                  {isPaused ? "Activate" : "Pause"}
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="size-3.5" />
                  Duplicate
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {experience.title}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the listing from your dashboard view for this demo session.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          setDeletedIds((prev) => new Set(prev).add(experience.id))
                        }
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
