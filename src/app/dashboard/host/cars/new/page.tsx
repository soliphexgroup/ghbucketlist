"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { carFeatures } from "@/data/car-features";
import { useCurrentHostId, useHostCars } from "@/lib/host-repository";
import { addHostCreatedCar, upsertHostCreatedCar } from "@/lib/host-cars-store";
import type { Car, CarCancellationPolicy, CarCategory, TransmissionType } from "@/lib/car-types";

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

export default function AddCarPage() {
  return (
    <Suspense fallback={null}>
      <CarFormResolver />
    </Suspense>
  );
}

function CarFormResolver() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const hostCars = useHostCars();
  const existing = editId ? hostCars.find((c) => c.id === editId) : undefined;

  return <CarForm key={existing?.id ?? editId ?? "new"} existing={existing} />;
}

function CarForm({ existing }: { existing?: Car }) {
  const router = useRouter();
  const hostId = useCurrentHostId();
  const isEditing = Boolean(existing);

  const [make, setMake] = useState(existing?.make ?? "");
  const [model, setModel] = useState(existing?.model ?? "");
  const [year, setYear] = useState(String(existing?.year ?? new Date().getFullYear()));
  const [category, setCategory] = useState<CarCategory>(existing?.category ?? "economy");
  const [pickupLocation, setPickupLocation] = useState(existing?.pickupLocation ?? "");
  const [transmission, setTransmission] = useState<TransmissionType>(existing?.transmission ?? "automatic");
  const [seats, setSeats] = useState(String(existing?.seats ?? 5));
  const [luggage, setLuggage] = useState(String(existing?.luggage ?? 2));
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(existing?.features ?? ["ac"]);
  const [pricePerDay, setPricePerDay] = useState(String(existing?.pricePerDay ?? 300));
  const [driverAvailable, setDriverAvailable] = useState(existing?.driverAvailable ?? false);
  const [withDriverPricePerDay, setWithDriverPricePerDay] = useState(
    String(existing?.withDriverPricePerDay ?? 450)
  );
  const [mileageLimitPerDay, setMileageLimitPerDay] = useState(String(existing?.mileageLimitPerDay ?? 200));
  const [minRentalDays, setMinRentalDays] = useState(String(existing?.minRentalDays ?? 1));
  const [maxRentalDays, setMaxRentalDays] = useState(existing?.maxRentalDays ? String(existing.maxRentalDays) : "");
  const [bookingType, setBookingType] = useState<Car["bookingType"]>(existing?.bookingType ?? "instant");
  const [cancellationPolicy, setCancellationPolicy] = useState<CarCancellationPolicy>(
    existing?.cancellationPolicy ?? "flexible"
  );
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  function toggleFeature(key: string, checked: boolean) {
    setSelectedFeatures((prev) => (checked ? [...prev, key] : prev.filter((f) => f !== key)));
  }

  const canSubmit =
    make.trim().length > 0 &&
    model.trim().length > 0 &&
    Number(year) > 1980 &&
    pickupLocation.trim().length > 0 &&
    Number(pricePerDay) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (!canSubmit) return;

    const sharedFields = {
      make: make.trim(),
      model: model.trim(),
      year: Number(year) || new Date().getFullYear(),
      category,
      pickupLocation: pickupLocation.trim(),
      transmission,
      seats: Number(seats) || 1,
      luggage: Number(luggage) || 0,
      features: selectedFeatures,
      pricePerDay: Number(pricePerDay) || 0,
      withDriverPricePerDay: driverAvailable ? Number(withDriverPricePerDay) || 0 : Number(pricePerDay) || 0,
      driverAvailable,
      mileageLimitPerDay: Number(mileageLimitPerDay) || 0,
      minRentalDays: Number(minRentalDays) || 1,
      maxRentalDays: maxRentalDays ? Number(maxRentalDays) : undefined,
      bookingType,
      cancellationPolicy,
    };

    if (existing) {
      const updated: Car = { ...existing, ...sharedFields };
      upsertHostCreatedCar(updated);
      router.push("/dashboard/host/cars");
      return;
    }

    const slugBase = slugify(`${make} ${model} ${year}`) || "car";
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;

    const car: Car = {
      id: `car-host-${Date.now()}`,
      slug,
      vendorId: hostId,
      images: placeholderImages(slug, 5),
      city: "Accra",
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      ...sharedFields,
    };

    addHostCreatedCar(car);
    router.push("/dashboard/host/cars");
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {isEditing ? "Edit Car" : "Add New Car"}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {isEditing ? "Update the details for this vehicle." : "List a vehicle for self-drive or chauffeured rental."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex max-w-2xl flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Vehicle</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="make">Make</Label>
              <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Toyota" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Corolla" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input id="year" type="number" min={1980} value={year} onChange={(e) => setYear(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as CarCategory)}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pickup">Pickup location</Label>
              <Input id="pickup" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} placeholder="e.g. Airport Residential, Accra" className="mt-1.5" />
            </div>
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Specs</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label>Transmission</Label>
              <Select value={transmission} onValueChange={(v) => setTransmission(v as TransmissionType)}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="seats">Seats</Label>
              <Input id="seats" type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="luggage">Luggage</Label>
              <Input id="luggage" type="number" min={0} value={luggage} onChange={(e) => setLuggage(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="mileage">Mileage/day (km)</Label>
              <Input id="mileage" type="number" min={0} value={mileageLimitPerDay} onChange={(e) => setMileageLimitPerDay(e.target.value)} className="mt-1.5" />
            </div>
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Features</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {carFeatures.map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={selectedFeatures.includes(f.key)} onCheckedChange={(checked) => toggleFeature(f.key, checked === true)} />
                {f.label}
              </label>
            ))}
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Pricing & rental terms</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="price-per-day">Price per day (GHS)</Label>
              <Input id="price-per-day" type="number" min={0} value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="mileage-note" className="text-muted-foreground">&nbsp;</Label>
              <div className="mt-1.5 flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <Label htmlFor="driver-available" className="text-sm font-medium text-foreground">Chauffeur available</Label>
                <Switch id="driver-available" checked={driverAvailable} onCheckedChange={setDriverAvailable} />
              </div>
            </div>
          </div>
          {driverAvailable && (
            <div>
              <Label htmlFor="with-driver-price">With-driver price per day (GHS)</Label>
              <Input id="with-driver-price" type="number" min={0} value={withDriverPricePerDay} onChange={(e) => setWithDriverPricePerDay(e.target.value)} className="mt-1.5" />
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="min-rental">Minimum rental days</Label>
              <Input id="min-rental" type="number" min={1} value={minRentalDays} onChange={(e) => setMinRentalDays(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="max-rental">Maximum rental days (optional)</Label>
              <Input id="max-rental" type="number" min={1} value={maxRentalDays} onChange={(e) => setMaxRentalDays(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Booking type</Label>
              <Select value={bookingType} onValueChange={(v) => setBookingType(v as Car["bookingType"])}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant Book</SelectItem>
                  <SelectItem value="request">Request to Book</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cancellation policy</Label>
              <Select value={cancellationPolicy} onValueChange={(v) => setCancellationPolicy(v as CarCancellationPolicy)}>
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
          </div>
        </section>

        {attemptedSubmit && !canSubmit && (
          <p className="text-sm text-destructive">
            Please fill in the make, model, year, pickup location, and a daily price before publishing.
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" size="lg">
            {isEditing ? "Save Changes" : "Publish Car"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.push("/dashboard/host/cars")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
