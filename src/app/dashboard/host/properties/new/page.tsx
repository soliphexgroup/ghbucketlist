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
import { amenities } from "@/data/amenities";
import { useCurrentHostId, useHostProperties } from "@/lib/host-repository";
import { addHostCreatedProperty, upsertHostCreatedProperty } from "@/lib/host-properties-store";
import type { CancellationPolicy, Property, PropertyRoom, PropertyType, StayBookingType } from "@/lib/stay-types";

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

let roomIdCounter = 0;
function newRoomId() {
  roomIdCounter += 1;
  return `new-room-${Date.now()}-${roomIdCounter}`;
}

function defaultRooms(): PropertyRoom[] {
  return [{ id: newRoomId(), roomName: "Main bedroom", bedType: "Queen", bedCount: 1 }];
}

export default function AddPropertyPage() {
  return (
    <Suspense fallback={null}>
      <PropertyFormResolver />
    </Suspense>
  );
}

function PropertyFormResolver() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const hostProperties = useHostProperties();
  const existing = editId ? hostProperties.find((p) => p.id === editId) : undefined;

  return <PropertyForm key={existing?.id ?? editId ?? "new"} existing={existing} />;
}

function PropertyForm({ existing }: { existing?: Property }) {
  const router = useRouter();
  const hostId = useCurrentHostId();
  const isEditing = Boolean(existing);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [propertyType, setPropertyType] = useState<PropertyType>(existing?.propertyType ?? "apartment");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [neighbourhood, setNeighbourhood] = useState(existing?.neighbourhood ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [bedrooms, setBedrooms] = useState(String(existing?.bedrooms ?? 1));
  const [bathrooms, setBathrooms] = useState(String(existing?.bathrooms ?? 1));
  const [maxGuests, setMaxGuests] = useState(String(existing?.maxGuests ?? 2));
  const [sizeSqm, setSizeSqm] = useState(existing?.sizeSqm ? String(existing.sizeSqm) : "");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(existing?.amenities ?? ["wifi"]);
  const [rooms, setRooms] = useState<PropertyRoom[]>(existing && existing.rooms.length > 0 ? existing.rooms : defaultRooms);
  const [pricePerNight, setPricePerNight] = useState(String(existing?.pricePerNight ?? 300));
  const [weekendPrice, setWeekendPrice] = useState(existing?.weekendPrice ? String(existing.weekendPrice) : "");
  const [cleaningFee, setCleaningFee] = useState(String(existing?.cleaningFee ?? 50));
  const [minNights, setMinNights] = useState(String(existing?.minNights ?? 1));
  const [maxNights, setMaxNights] = useState(existing?.maxNights ? String(existing.maxNights) : "");
  const [checkInTime, setCheckInTime] = useState(existing?.checkInTime ?? "2:00 PM");
  const [checkOutTime, setCheckOutTime] = useState(existing?.checkOutTime ?? "11:00 AM");
  const [bookingType, setBookingType] = useState<StayBookingType>(existing?.bookingType ?? "instant");
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>(existing?.cancellationPolicy ?? "flexible");
  const [noSmoking, setNoSmoking] = useState(existing?.noSmoking ?? true);
  const [noParties, setNoParties] = useState(existing?.noParties ?? true);
  const [petsAllowed, setPetsAllowed] = useState(existing?.petsAllowed ?? false);
  const [customRules, setCustomRules] = useState(existing?.customRules ?? "");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  function toggleAmenity(key: string, checked: boolean) {
    setSelectedAmenities((prev) => (checked ? [...prev, key] : prev.filter((a) => a !== key)));
  }

  function updateRoom(id: string, patch: Partial<PropertyRoom>) {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRoom() {
    setRooms((prev) => [...prev, { id: newRoomId(), roomName: "", bedType: "Queen", bedCount: 1 }]);
  }

  function removeRoom(id: string) {
    setRooms((prev) => prev.filter((r) => r.id !== id));
  }

  const validRooms = rooms.filter((r) => r.roomName.trim().length > 0);
  const canSubmit =
    title.trim().length > 2 &&
    description.trim().length > 20 &&
    neighbourhood.trim().length > 0 &&
    address.trim().length > 0 &&
    validRooms.length > 0 &&
    Number(pricePerNight) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (!canSubmit) return;

    const sharedFields = {
      title: title.trim(),
      description: description.trim(),
      propertyType,
      neighbourhood: neighbourhood.trim(),
      address: address.trim(),
      bedrooms: Number(bedrooms) || 1,
      bathrooms: Number(bathrooms) || 1,
      maxGuests: Number(maxGuests) || 1,
      sizeSqm: sizeSqm ? Number(sizeSqm) : undefined,
      amenities: selectedAmenities,
      rooms: validRooms,
      pricePerNight: Number(pricePerNight) || 0,
      weekendPrice: weekendPrice ? Number(weekendPrice) : undefined,
      cleaningFee: Number(cleaningFee) || 0,
      minNights: Number(minNights) || 1,
      maxNights: maxNights ? Number(maxNights) : undefined,
      checkInTime: checkInTime.trim(),
      checkOutTime: checkOutTime.trim(),
      bookingType,
      cancellationPolicy,
      noSmoking,
      noParties,
      petsAllowed,
      customRules: customRules.trim() || undefined,
    };

    if (existing) {
      const updated: Property = { ...existing, ...sharedFields };
      upsertHostCreatedProperty(updated);
      router.push("/dashboard/host/properties");
      return;
    }

    const slugBase = slugify(title) || "property";
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;

    const property: Property = {
      id: `prop-host-${Date.now()}`,
      slug,
      hostId,
      images: placeholderImages(slug, 5),
      city: "Accra",
      rating: 0,
      reviewCount: 0,
      categoryRatings: { cleanliness: 0, accuracy: 0, communication: 0, location: 0, value: 0 },
      createdAt: new Date().toISOString(),
      ...sharedFields,
    };

    addHostCreatedProperty(property);
    router.push("/dashboard/host/properties");
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {isEditing ? "Edit Property" : "Add New Property"}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {isEditing ? "Update the details for this listing." : "List a hotel room, apartment, or vacation home."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex max-w-2xl flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Basics</h2>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Osu Garden Apartment" className="mt-1.5" />
          </div>
          <div>
            <Label>Property type</Label>
            <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType)}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="vacation">Vacation Home</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Describe the property…" className="mt-1.5" />
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Location</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="neighbourhood">Neighbourhood</Label>
              <Input id="neighbourhood" value={neighbourhood} onChange={(e) => setNeighbourhood(e.target.value)} placeholder="e.g. Osu" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 8 Cantonments Road" className="mt-1.5" />
            </div>
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Capacity</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input id="bedrooms" type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input id="bathrooms" type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="max-guests">Max guests</Label>
              <Input id="max-guests" type="number" min={1} value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="size-sqm">Size (sqm, optional)</Label>
              <Input id="size-sqm" type="number" min={0} value={sizeSqm} onChange={(e) => setSizeSqm(e.target.value)} className="mt-1.5" />
            </div>
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Sleeping arrangements</h2>
          {rooms.map((room) => (
            <div key={room.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_5rem_auto] sm:items-end">
              <div>
                <Label className="text-xs text-muted-foreground">Room name</Label>
                <Input value={room.roomName} onChange={(e) => updateRoom(room.id, { roomName: e.target.value })} placeholder="e.g. Second bedroom" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bed type</Label>
                <Input value={room.bedType} onChange={(e) => updateRoom(room.id, { bedType: e.target.value })} placeholder="e.g. Queen" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Beds</Label>
                <Input type="number" min={1} value={room.bedCount} onChange={(e) => updateRoom(room.id, { bedCount: Number(e.target.value) })} className="mt-1" />
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => removeRoom(room.id)} disabled={rooms.length === 1} aria-label="Remove room">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addRoom} className="w-fit">
            <Plus className="size-3.5" />
            Add room
          </Button>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Amenities</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenities.map((a) => (
              <label key={a.key} className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={selectedAmenities.includes(a.key)} onCheckedChange={(checked) => toggleAmenity(a.key, checked === true)} />
                {a.label}
              </label>
            ))}
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Pricing</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="price-per-night">Price per night (GHS)</Label>
              <Input id="price-per-night" type="number" min={0} value={pricePerNight} onChange={(e) => setPricePerNight(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="weekend-price">Weekend price (optional)</Label>
              <Input id="weekend-price" type="number" min={0} value={weekendPrice} onChange={(e) => setWeekendPrice(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="cleaning-fee">Cleaning fee</Label>
              <Input id="cleaning-fee" type="number" min={0} value={cleaningFee} onChange={(e) => setCleaningFee(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="min-nights">Minimum nights</Label>
              <Input id="min-nights" type="number" min={1} value={minNights} onChange={(e) => setMinNights(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="max-nights">Maximum nights (optional)</Label>
              <Input id="max-nights" type="number" min={1} value={maxNights} onChange={(e) => setMaxNights(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Booking type</Label>
            <Select value={bookingType} onValueChange={(v) => setBookingType(v as StayBookingType)}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant Book</SelectItem>
                <SelectItem value="request">Request to Book</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">House rules & cancellation</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="check-in">Check-in time</Label>
              <Input id="check-in" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="check-out">Check-out time</Label>
              <Input id="check-out" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Cancellation policy</Label>
            <Select value={cancellationPolicy} onValueChange={(v) => setCancellationPolicy(v as CancellationPolicy)}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flexible">Flexible</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="strict">Strict</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="no-smoking" className="text-sm font-medium text-foreground">No smoking</Label>
            <Switch id="no-smoking" checked={noSmoking} onCheckedChange={setNoSmoking} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="no-parties" className="text-sm font-medium text-foreground">No parties or events</Label>
            <Switch id="no-parties" checked={noParties} onCheckedChange={setNoParties} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="pets-allowed" className="text-sm font-medium text-foreground">Pets allowed</Label>
            <Switch id="pets-allowed" checked={petsAllowed} onCheckedChange={setPetsAllowed} />
          </div>
          <div>
            <Label htmlFor="custom-rules">Additional rules (optional)</Label>
            <Textarea id="custom-rules" value={customRules} onChange={(e) => setCustomRules(e.target.value)} rows={2} className="mt-1.5" />
          </div>
        </section>

        {attemptedSubmit && !canSubmit && (
          <p className="text-sm text-destructive">
            Please fill in the title, description, location, at least one room, and a nightly price before publishing.
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" size="lg">
            {isEditing ? "Save Changes" : "Publish Property"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.push("/dashboard/host/properties")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
