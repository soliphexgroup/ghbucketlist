"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListingImageManager } from "@/components/dashboard/listing-image-manager";
import { serviceCategories, serviceCategoryLabels } from "@/data/service-categories";
import { useCurrentHostId } from "@/lib/host-repository";
import { createServiceListing, updateServiceListing, useHostDbServiceListings } from "@/lib/db-listings";
import { EditListingLoading, EditListingNotFound } from "@/components/dashboard/edit-listing-gate";
import type { ServiceCategory, ServiceProvider } from "@/lib/service-types";

const WORK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function placeholderImages(seed: string, count: number) {
  return Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${seed}-${i}/1200/900`);
}

export default function AddServicePage() {
  return (
    <Suspense fallback={null}>
      <ServiceFormResolver />
    </Suspense>
  );
}

function ServiceFormResolver() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { items: hostServices, loaded } = useHostDbServiceListings(useCurrentHostId());
  const existing = editId ? hostServices.find((s) => s.id === editId) : undefined;

  // When editing, wait for the listing to load so the form mounts pre-filled instead of blank.
  if (editId && !loaded) return <EditListingLoading />;
  if (editId && loaded && !existing) return <EditListingNotFound backHref="/dashboard/host/services" />;

  return <ServiceForm key={existing?.id ?? "new"} existing={existing} />;
}

function ServiceForm({ existing }: { existing?: ServiceProvider }) {
  const router = useRouter();
  const hostId = useCurrentHostId();
  const isEditing = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState<ServiceCategory>(existing?.category ?? "carpenter");
  const [city, setCity] = useState(existing?.city ?? "Accra");
  const [serviceArea, setServiceArea] = useState(existing?.serviceArea ?? "");
  const [bio, setBio] = useState(existing?.bio ?? "");
  const [yearsExperience, setYearsExperience] = useState(String(existing?.yearsExperience ?? 1));
  const [hourlyRate, setHourlyRate] = useState(String(existing?.hourlyRate ?? 80));
  const [workingDays, setWorkingDays] = useState<string[]>(
    existing?.workingDays ?? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  );
  const [skills, setSkills] = useState<string[]>(
    existing && existing.skills.length > 0 ? existing.skills : [""]
  );
  const [images, setImages] = useState<string[]>(existing?.portfolioImages ?? []);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function toggleDay(day: string, checked: boolean) {
    setWorkingDays((prev) => (checked ? [...prev, day] : prev.filter((d) => d !== day)));
  }

  function updateSkill(index: number, value: string) {
    setSkills((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function addSkill() {
    setSkills((prev) => [...prev, ""]);
  }

  function removeSkill(index: number) {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  }

  const validationErrors = [
    name.trim().length > 2 ? null : "Add your name or business name (at least 3 characters).",
    serviceArea.trim().length > 0 ? null : "Add the area you cover.",
    bio.trim().length > 20 ? null : "Write a short bio of at least 20 characters.",
    Number(hourlyRate) > 0 ? null : "Set an hourly rate greater than 0.",
    workingDays.length > 0 ? null : "Pick at least one day you work.",
    images.length >= 2 ? null : "Add at least 2 photos of your work.",
  ].filter((e): e is string => e !== null);
  const canSubmit = validationErrors.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttemptedSubmit(true);
    setSaveError("");
    if (!canSubmit || saving) return;

    const cleanSkills = skills.map((s) => s.trim()).filter(Boolean);
    const sharedFields = {
      name: name.trim(),
      category,
      city: city.trim() || "Accra",
      serviceArea: serviceArea.trim(),
      bio: bio.trim(),
      yearsExperience: Number(yearsExperience) || 0,
      hourlyRate: Number(hourlyRate) || 0,
      workingDays,
      skills: cleanSkills,
    };

    setSaving(true);

    if (existing) {
      const updated: ServiceProvider = {
        ...existing,
        ...sharedFields,
        // Stock images stand in only until the host adds their own.
        portfolioImages: images.length > 0 ? images : placeholderImages(existing.slug, 4),
      };
      const res = await updateServiceListing(updated, hostId);
      if (!res.ok) {
        setSaveError(res.message);
        setSaving(false);
        return;
      }
      router.push("/dashboard/host/services");
      return;
    }

    const slugBase = slugify(name) || "provider";
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;

    const provider: ServiceProvider = {
      id: `svc-host-${Date.now()}`,
      slug,
      avatarUrl: `https://i.pravatar.cc/150?u=${slug}`,
      portfolioImages: images.length > 0 ? images : placeholderImages(slug, 4),
      // New providers start unverified with zeroed trust metrics — admin grants the verified badge,
      // and ratings/jobs accrue from real activity.
      verified: false,
      responseTimeMinutes: 60,
      completedJobs: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      ...sharedFields,
    };

    const res = await createServiceListing(provider, hostId);
    if (!res.ok) {
      setSaveError(res.message);
      setSaving(false);
      return;
    }
    router.push("/dashboard/host/services");
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {isEditing ? "Edit Service" : "Add New Service"}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {isEditing
          ? "Update the details clients see for this service."
          : "List a handyman service clients can find and request."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex max-w-2xl flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Basics</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name or business</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kofi's Carpentry"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ServiceCategory)}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {serviceCategoryLabels[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="bio">About your service</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe the work you do and what clients can expect…"
              rows={4}
              className="mt-1.5"
            />
          </div>
        </section>

        <Separator />

        <section>
          <ListingImageManager value={images} onChange={setImages} minImages={2} />
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Coverage & experience</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="service-area">Service area</Label>
              <Input
                id="service-area"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="e.g. East Legon"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="years">Years of experience</Label>
              <Input
                id="years"
                type="number"
                min={0}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Days you work
            </Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WORK_DAYS.map((day) => (
                <label key={day} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={workingDays.includes(day)}
                    onCheckedChange={(checked) => toggleDay(day, checked === true)}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Pricing</h2>
          <div className="max-w-[220px]">
            <Label htmlFor="hourly-rate">Hourly rate (GHS)</Label>
            <Input
              id="hourly-rate"
              type="number"
              min={0}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Skills</h2>
          {skills.map((skill, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={skill}
                onChange={(e) => updateSkill(index, e.target.value)}
                placeholder="e.g. Custom furniture, door repairs"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeSkill(index)}
                disabled={skills.length === 1}
                aria-label="Remove skill"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addSkill} className="w-fit">
            <Plus className="size-3.5" />
            Add skill
          </Button>
        </section>

        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
          New services publish as <span className="font-medium text-foreground">Pending verification</span>. Our team
          reviews and grants the verified badge — ratings and completed-job counts build up from real client requests.
        </p>

        {attemptedSubmit && validationErrors.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <p className="font-medium">Before publishing, please fix:</p>
            <ul className="mt-1 list-disc pl-5">
              {validationErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        {saveError && <p className="text-sm text-destructive">{saveError}</p>}

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Publish Service"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/dashboard/host/services")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
