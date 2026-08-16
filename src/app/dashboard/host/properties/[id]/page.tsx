"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Copy, Loader2, RefreshCw, Trash2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCurrentHostId } from "@/lib/host-repository";
import { useHostDbStayListings } from "@/lib/db-listings";
import {
  useCalendarFeeds,
  addCalendarFeed,
  removeCalendarFeed,
  syncFeedNow,
  listingExportUrl,
  type CalendarFeed,
} from "@/lib/calendar-sync";
import { EditListingLoading, EditListingNotFound } from "@/components/dashboard/edit-listing-gate";

const SOURCES = [
  { value: "booking.com", label: "Booking.com" },
  { value: "airbnb", label: "Airbnb" },
  { value: "vrbo", label: "VRBO" },
  { value: "other", label: "Other" },
];

export default function CalendarSyncPage() {
  const listingId = String(useParams().id ?? "");
  const { items: properties, loaded } = useHostDbStayListings(useCurrentHostId());
  const property = properties.find((p) => p.id === listingId);

  if (!loaded) return <EditListingLoading />;
  if (!property) return <EditListingNotFound backHref="/dashboard/host/properties" />;

  return <CalendarSync listingId={listingId} title={property.title} />;
}

function CalendarSync({ listingId, title }: { listingId: string; title: string }) {
  const { feeds, loaded, refresh } = useCalendarFeeds(listingId);
  const [source, setSource] = useState("booking.com");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const exportUrl = listingExportUrl(listingId);

  async function add() {
    setError("");
    const trimmed = url.trim();
    if (!/^https?:\/\/.+/i.test(trimmed)) return setError("Enter a valid calendar URL (it should start with https://).");
    setAdding(true);
    const res = await addCalendarFeed({ listingId, source, url: trimmed });
    setAdding(false);
    if (!res.ok) return setError(res.message);
    setUrl("");
    refresh();
  }

  async function copyExport() {
    await navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/host/properties"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        My Properties
      </Link>

      <h1 className="font-heading text-2xl font-bold text-foreground">Calendar Sync</h1>
      <p className="mt-1 text-muted-foreground">
        Keep <span className="font-medium text-foreground">{title}</span> from being double-booked across
        GHBucketlist and the other sites you list it on — Booking.com, Airbnb, VRBO and more. Connect each
        calendar once and dates sync automatically.
      </p>

      {/* 1. Import */}
      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          1. Bring another calendar in
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          On the other site (Booking.com, Airbnb, VRBO…), open its calendar sync settings and copy the{" "}
          <span className="font-medium text-foreground">Export / iCal</span> link — it ends in <code>.ics</code>.
          Paste it below and pick the source. Dates booked there will show unavailable here.
        </p>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="sm:w-40">
              <Label htmlFor="feed-source" className="text-xs">Source</Label>
              <select
                id="feed-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label htmlFor="feed-url" className="text-xs">Calendar link (.ics)</Label>
              <Input
                id="feed-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://ical.booking.com/v1/export?t=…"
                className="mt-1"
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <Button onClick={add} disabled={adding}>
              {adding && <Loader2 className="size-4 animate-spin" />}
              Add calendar
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {loaded && feeds.length === 0 && (
            <p className="text-sm text-muted-foreground">No calendars connected yet.</p>
          )}
          {feeds.map((f) => (
            <FeedRow key={f.id} feed={f} onChanged={refresh} />
          ))}
        </div>
      </section>

      {/* 2. Export */}
      <section className="mt-10">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          2. Send your GHBucketlist calendar out
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Copy this link and paste it into the other site&apos;s{" "}
          <span className="font-medium text-foreground">Import calendar</span> setting. Bookings made on
          GHBucketlist will then block those dates there too.
        </p>
        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-border p-4 sm:flex-row sm:items-center">
          <Input readOnly value={exportUrl} className="flex-1 text-xs text-muted-foreground" onFocus={(e) => e.currentTarget.select()} />
          <Button variant="outline" onClick={copyExport} className="shrink-0">
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      </section>

    </div>
  );
}

function FeedRow({ feed, onChanged }: { feed: CalendarFeed; onChanged: () => void }) {
  const [busy, setBusy] = useState<"sync" | "remove" | null>(null);
  const [note, setNote] = useState("");

  async function sync() {
    setBusy("sync");
    setNote("");
    const res = await syncFeedNow(feed.id);
    setBusy(null);
    setNote(res.ok ? `Synced ${res.events ?? 0} dates.` : res.message || "Sync failed.");
    onChanged();
  }

  async function remove() {
    setBusy("remove");
    await removeCalendarFeed(feed.id);
    onChanged();
  }

  const sourceLabel = SOURCES.find((s) => s.value === feed.source)?.label ?? feed.source;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{sourceLabel}</span>
            {feed.lastStatus === "ok" && <Badge className="bg-success/10 text-success">Synced</Badge>}
            {feed.lastStatus === "error" && <Badge className="bg-destructive/10 text-destructive">Error</Badge>}
            {!feed.lastStatus && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <WifiOff className="size-3" /> Not synced yet
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{feed.url}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {feed.lastSyncedAt
              ? `Last synced ${new Date(feed.lastSyncedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}${
                  feed.lastStatus === "ok" && feed.lastEventCount != null ? ` · ${feed.lastEventCount} dates` : ""
                }`
              : "Add is saved — press Sync now, or it syncs on the next scheduled run."}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={sync} disabled={busy !== null}>
            {busy === "sync" ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Sync now
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={remove}
            disabled={busy !== null}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      {(note || feed.lastError) && (
        <p className={`text-xs ${note.startsWith("Synced") ? "text-success" : "text-destructive"}`}>
          {note || `Last error: ${feed.lastError}`}
        </p>
      )}
    </div>
  );
}
