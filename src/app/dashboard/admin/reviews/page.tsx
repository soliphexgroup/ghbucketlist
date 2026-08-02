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
import { useAdminReviews, setReviewStatus } from "@/lib/db-reviews";
import { useAdminListings } from "@/lib/db-admin-listings";
import { cn } from "@/lib/utils";

export default function AdminReviewsPage() {
  const { reviews, refresh } = useAdminReviews();
  const { listings } = useAdminListings();
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const titleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of listings) m.set(l.id, l.title);
    return m;
  }, [listings]);

  const rows = useMemo(
    () =>
      reviews
        .filter((r) => (ratingFilter === "all" ? true : r.rating === Number(ratingFilter)))
        .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter)),
    [reviews, ratingFilter, statusFilter]
  );

  async function moderate(id: string, status: "visible" | "hidden") {
    setBusy(id);
    setError(null);
    const res = await setReviewStatus(id, status);
    setBusy(null);
    if (!res.ok) return setError(res.message);
    refresh();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Reviews</h1>
      <p className="mt-1 text-muted-foreground">Moderate reviews across the platform.</p>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

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
            <SelectItem value="visible">Visible</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Showing {rows.length} review{rows.length === 1 ? "" : "s"}
      </p>

      <div className="mt-2 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Reviewer</th>
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Review</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border align-top">
                <td className="whitespace-nowrap px-4 py-3 text-foreground">{r.userName}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {titleById.get(r.listingId) ?? r.listingId}
                  <span className="ml-1 text-xs capitalize text-muted-foreground/70">· {r.kind}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    {r.rating}
                    <Star className="size-3.5 fill-brand-gold text-brand-gold" />
                  </span>
                </td>
                <td className="max-w-xs px-4 py-3 text-muted-foreground">{r.text}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("capitalize", r.status === "visible" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                    {r.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {r.status === "visible" ? (
                    <button disabled={busy === r.id} onClick={() => moderate(r.id, "hidden")} className="text-xs font-medium text-destructive hover:underline disabled:opacity-40">
                      Hide
                    </button>
                  ) : (
                    <button disabled={busy === r.id} onClick={() => moderate(r.id, "visible")} className="text-xs font-medium text-success hover:underline disabled:opacity-40">
                      Publish
                    </button>
                  )}
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
