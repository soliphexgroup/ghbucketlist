"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListingImageManager } from "@/components/dashboard/listing-image-manager";
import { categories } from "@/data/categories";
import { useCurrentHostId, useHostExperiences } from "@/lib/host-repository";
import { addHostCreatedExperience, upsertHostCreatedExperience } from "@/lib/host-experiences-store";
import type { Experience, TicketType } from "@/lib/types";

const SCHEDULE_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function placeholderImages(seed: string, count: number) {
  return Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${seed}-${i}/1200/900`);
}

let ticketIdCounter = 0;
function newTicketId() {
  ticketIdCounter += 1;
  return `new-ticket-${Date.now()}-${ticketIdCounter}`;
}

function defaultTicketTypes(): TicketType[] {
  return [{ id: newTicketId(), name: "Standard Ticket", priceGHS: 100 }];
}

export default function AddExperiencePage() {
  return (
    <Suspense fallback={null}>
      <ExperienceFormResolver />
    </Suspense>
  );
}

function ExperienceFormResolver() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const hostExperiences = useHostExperiences();
  const existing = editId ? hostExperiences.find((e) => e.id === editId) : undefined;

  // Remounts (via key) whenever the resolved edit target changes — including the moment
  // the localStorage-backed store hydrates on the client — so the form's initial state
  // always reflects `existing` without needing an effect-driven setState cascade.
  return <ExperienceForm key={existing?.id ?? editId ?? "new"} existing={existing} />;
}

function ExperienceForm({ existing }: { existing?: Experience }) {
  const router = useRouter();
  const hostId = useCurrentHostId();
  const isEditing = Boolean(existing);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? categories[0]?.id ?? "");
  const [shortDescription, setShortDescription] = useState(existing?.shortDescription ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [venueName, setVenueName] = useState(existing?.venueName ?? "");
  const [neighbourhood, setNeighbourhood] = useState(existing?.neighbourhood ?? "");
  const [durationMinutes, setDurationMinutes] = useState(String(existing?.durationMinutes ?? 90));
  const [maxCapacity, setMaxCapacity] = useState(String(existing?.maxCapacity ?? 10));
  const [minAttendees, setMinAttendees] = useState(String(existing?.minAttendees ?? 1));
  const [isFree, setIsFree] = useState(existing?.isFree ?? false);
  const [acceptsDonations, setAcceptsDonations] = useState(existing?.acceptsDonations ?? false);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>(() =>
    existing && !existing.isFree && existing.ticketTypes.length > 0 ? existing.ticketTypes : defaultTicketTypes()
  );
  const [scheduleDays, setScheduleDays] = useState<string[]>(existing?.scheduleDays ?? ["Saturday"]);
  const [scheduleTime, setScheduleTime] = useState(existing?.scheduleTime ?? "10:00 AM");
  const [whatsIncluded, setWhatsIncluded] = useState<string[]>(
    existing && existing.whatsIncluded.length > 0 ? existing.whatsIncluded : [""]
  );
  const [gpPoints, setGpPoints] = useState(String(existing?.gpPoints ?? 10));
  const [visibility, setVisibility] = useState<"public" | "private">(existing?.visibility ?? "public");
  const [images, setImages] = useState<string[]>(existing?.images ?? []);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  function toggleScheduleDay(day: string, checked: boolean) {
    setScheduleDays((prev) => (checked ? [...prev, day] : prev.filter((d) => d !== day)));
  }

  function updateTicket(id: string, patch: Partial<TicketType>) {
    setTicketTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addTicket() {
    setTicketTypes((prev) => [...prev, { id: newTicketId(), name: "", priceGHS: 0 }]);
  }

  function removeTicket(id: string) {
    setTicketTypes((prev) => prev.filter((t) => t.id !== id));
  }

  function updateIncluded(index: number, value: string) {
    setWhatsIncluded((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  function addIncluded() {
    setWhatsIncluded((prev) => [...prev, ""]);
  }

  function removeIncluded(index: number) {
    setWhatsIncluded((prev) => prev.filter((_, i) => i !== index));
  }

  const validTickets = ticketTypes.filter((t) => t.name.trim().length > 0 && t.priceGHS > 0);
  const canSubmit =
    title.trim().length > 2 &&
    shortDescription.trim().length > 5 &&
    description.trim().length > 20 &&
    venueName.trim().length > 0 &&
    neighbourhood.trim().length > 0 &&
    scheduleDays.length > 0 &&
    scheduleTime.trim().length > 0 &&
    (isFree || validTickets.length > 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (!canSubmit) return;

    const included = whatsIncluded.map((s) => s.trim()).filter(Boolean);
    const ticketsToSave: TicketType[] = isFree ? [{ id: "free", name: "Free Entry", priceGHS: 0 }] : validTickets;

    if (existing) {
      const updated: Experience = {
        ...existing,
        // Stock images stand in only until the host adds their own.
        images: images.length > 0 ? images : placeholderImages(existing.slug, 5),
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        categoryId,
        venueName: venueName.trim(),
        neighbourhood: neighbourhood.trim(),
        durationMinutes: Number(durationMinutes) || 60,
        maxCapacity: Number(maxCapacity) || 1,
        minAttendees: Number(minAttendees) || 1,
        isFree,
        acceptsDonations: isFree && acceptsDonations,
        ticketTypes: ticketsToSave,
        scheduleDays,
        scheduleTime: scheduleTime.trim(),
        whatsIncluded: included,
        gpPoints: Number(gpPoints) || 0,
        visibility,
      };
      upsertHostCreatedExperience(updated);
      router.push("/dashboard/host/experiences");
      return;
    }

    const slugBase = slugify(title) || "experience";
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;

    const experience: Experience = {
      id: `exp-host-${Date.now()}`,
      slug,
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      categoryId,
      hostId,
      images: images.length > 0 ? images : placeholderImages(slug, 5),
      venueName: venueName.trim(),
      neighbourhood: neighbourhood.trim(),
      city: "Accra",
      durationMinutes: Number(durationMinutes) || 60,
      maxCapacity: Number(maxCapacity) || 1,
      minAttendees: Number(minAttendees) || 1,
      isFree,
      acceptsDonations: isFree && acceptsDonations,
      ticketTypes: ticketsToSave,
      scheduleDays,
      scheduleTime: scheduleTime.trim(),
      whatsIncluded: included,
      gpPoints: Number(gpPoints) || 0,
      rating: 0,
      reviewCount: 0,
      visibility,
      createdAt: new Date().toISOString(),
    };

    addHostCreatedExperience(experience);
    router.push("/dashboard/host/experiences");
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {isEditing ? "Edit Experience" : "Add New Experience"}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {isEditing
          ? "Update the details for this listing."
          : "Create a listing for any kind of activity, class, tour, or event."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex max-w-2xl flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Basics</h2>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunset Kayaking on the Volta"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="short-description">Short description</Label>
            <Input
              id="short-description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="One line shown on activity cards"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="description">Full description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what guests can expect…"
              rows={5}
              className="mt-1.5"
            />
          </div>
        </section>

        <Separator />

        <section>
          <ListingImageManager value={images} onChange={setImages} />
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Location</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="venue-name">Venue name</Label>
              <Input
                id="venue-name"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g. Labadi Beach Club"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="neighbourhood">Neighbourhood</Label>
              <Input
                id="neighbourhood"
                value={neighbourhood}
                onChange={(e) => setNeighbourhood(e.target.value)}
                placeholder="e.g. Osu"
                className="mt-1.5"
              />
            </div>
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Capacity & duration</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="max-capacity">Max guests</Label>
              <Input
                id="max-capacity"
                type="number"
                min={1}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="min-attendees">Min attendees</Label>
              <Input
                id="min-attendees"
                type="number"
                min={1}
                value={minAttendees}
                onChange={(e) => setMinAttendees(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Pricing</h2>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="is-free" className="text-sm font-medium text-foreground">
              This experience is free
            </Label>
            <Switch id="is-free" checked={isFree} onCheckedChange={setIsFree} />
          </div>

          {isFree ? (
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <Label htmlFor="accepts-donations" className="text-sm font-medium text-foreground">
                Accept optional donations
              </Label>
              <Switch id="accepts-donations" checked={acceptsDonations} onCheckedChange={setAcceptsDonations} />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {ticketTypes.map((ticket) => (
                <div key={ticket.id} className="flex items-end gap-2 rounded-lg border border-border p-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Ticket name</Label>
                    <Input
                      value={ticket.name}
                      onChange={(e) => updateTicket(ticket.id, { name: e.target.value })}
                      placeholder="e.g. General Admission"
                      className="mt-1"
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs text-muted-foreground">Price (GHS)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={ticket.priceGHS}
                      onChange={(e) => updateTicket(ticket.id, { priceGHS: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeTicket(ticket.id)}
                    disabled={ticketTypes.length === 1}
                    aria-label="Remove ticket type"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addTicket} className="w-fit">
                <Plus className="size-3.5" />
                Add ticket type
              </Button>
            </div>
          )}
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Schedule</h2>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Days available
            </Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SCHEDULE_DAYS.map((day) => (
                <label key={day} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={scheduleDays.includes(day)}
                    onCheckedChange={(checked) => toggleScheduleDay(day, checked === true)}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="schedule-time">Start time</Label>
            <Input
              id="schedule-time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              placeholder="e.g. 9:00 AM"
              className="mt-1.5 max-w-[200px]"
            />
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">What&apos;s included</h2>
          {whatsIncluded.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={item}
                onChange={(e) => updateIncluded(index, e.target.value)}
                placeholder="e.g. All equipment provided"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeIncluded(index)}
                disabled={whatsIncluded.length === 1}
                aria-label="Remove item"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addIncluded} className="w-fit">
            <Plus className="size-3.5" />
            Add item
          </Button>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Rewards & visibility</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="gp-points">GP points earned per booking</Label>
              <Input
                id="gp-points"
                type="number"
                min={0}
                value={gpPoints}
                onChange={(e) => setGpPoints(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "private")}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public — listed on GH Bucketlist</SelectItem>
                  <SelectItem value="private">Private — link only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {attemptedSubmit && !canSubmit && (
          <p className="text-sm text-destructive">
            Please fill in the title, descriptions, location, schedule, and at least one ticket type (unless
            this experience is free) before publishing.
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" size="lg">
            {isEditing ? "Save Changes" : "Publish Experience"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.push("/dashboard/host/experiences")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
