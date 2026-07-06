"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reviews as allReviews } from "@/data/reviews";
import { experiences } from "@/data/experiences";
import { cn } from "@/lib/utils";

type ModerationStatus = "published" | "hidden";

export default function AdminReviewsPage() {
  const [overrides, setOverrides] = useState<Record<string, ModerationStatus>>({});
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const rows = useMemo(() => {
    return allReviews
      .map((r) => ({
        ...r,
        experienceTitle: experiences.find((e) => e.id === r.experienceId)?.title ?? "—",
        status: overrides[r.id] ?? ("published" as ModerationStatus),
      }))
      .filter((r) => (ratingFilter === "all" ? true : r.rating === Number(ratingFilter)))
      .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter));
  }, [overrides, ratingFilter, statusFilter]);

  function setStatus(id: string, status: ModerationStatus) {
    setOverrides((prev) => ({ ...prev, [id]: status }));
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Reviews</h1>
      <p className="mt-1 text-muted-foreground">Moderate reviews across the platform.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r} star
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Reviewer</th>
              <th className="px-4 py-3 font-medium">Activity</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Review</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border align-top">
                <td className="px-4 py-3 text-foreground whitespace-nowrap">{r.userName}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.experienceTitle}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    {r.rating}
                    <Star className="size-3.5 fill-brand-gold text-brand-gold" />
                  </span>
                </td>
                <td className="max-w-xs px-4 py-3 text-muted-foreground">{r.text}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("capitalize", r.status === "published" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                    {r.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {r.status === "published" ? (
                      <button onClick={() => setStatus(r.id, "hidden")} className="text-xs font-medium text-destructive hover:underline">
                        Hide
                      </button>
                    ) : (
                      <button onClick={() => setStatus(r.id, "published")} className="text-xs font-medium text-success hover:underline">
                        Publish
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No reviews match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
