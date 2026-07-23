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
import { useHostCars } from "@/lib/host-repository";
import { getCarBySlug } from "@/data/cars";
import { formatGHS } from "@/lib/format";

const categoryLabels = { economy: "Economy", suv: "SUV", luxury: "Luxury", van: "Van" };

export default function MyCarsPage() {
  const cars = useHostCars();
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

  const visible = cars.filter((c) => !deletedIds.has(c.id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">My Cars</h1>
          <p className="mt-1 text-muted-foreground">Manage your rental vehicles and their status.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/host/cars/new">
            <Plus className="size-4" />
            Add New Car
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {visible.map((car) => {
          const isPaused = pausedIds.has(car.id);
          const name = `${car.make} ${car.model} ${car.year}`;
          const viewHref = getCarBySlug(car.slug)
            ? `/cars/${car.slug}`
            : `/cars/preview?slug=${encodeURIComponent(car.slug)}`;

          return (
            <div
              key={car.id}
              className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-center"
            >
              <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-28">
                <Image src={car.images[0]} alt={name} fill className="object-cover" />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={viewHref}
                    className="font-heading font-semibold text-foreground hover:text-primary"
                  >
                    {name}
                  </Link>
                  <Badge variant="outline">{categoryLabels[car.category]}</Badge>
                  <Badge variant={isPaused ? "outline" : "default"}>
                    {isPaused ? "Paused" : "Active"}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>{formatGHS(car.pricePerDay)} / day</span>
                  <span>{car.seats} seats · {car.transmission === "automatic" ? "Automatic" : "Manual"}</span>
                  <StarRating rating={car.rating} reviewCount={car.reviewCount} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/host/cars/new?edit=${car.id}`}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => togglePause(car.id)}>
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
                      <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the listing from your dashboard view for this demo session.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => setDeletedIds((prev) => new Set(prev).add(car.id))}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">You don&apos;t have any cars listed yet.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/host/cars/new">Add your first car</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
