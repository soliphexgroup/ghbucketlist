"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CategoryIcon } from "@/components/category-icon";
import { amenities } from "@/data/amenities";
import { propertyPriceBounds } from "@/lib/stay-repository";
import { formatGHS } from "@/lib/format";
import type { PropertyType } from "@/lib/stay-types";
import type { StayFilterState } from "@/components/stay/stay-browser";

const propertyTypeOptions: { value: PropertyType; label: string }[] = [
  { value: "hotel", label: "Hotels" },
  { value: "apartment", label: "Apartments" },
  { value: "vacation", label: "Vacation Homes" },
];

export function StayFiltersSidebar({
  filters,
  onChange,
  onClear,
}: {
  filters: StayFilterState;
  onChange: (next: Partial<StayFilterState>) => void;
  onClear: () => void;
}) {
  const bounds = propertyPriceBounds();

  function togglePropertyType(type: PropertyType, checked: boolean) {
    const next = checked ? [...filters.propertyTypes, type] : filters.propertyTypes.filter((t) => t !== type);
    onChange({ propertyTypes: next });
  }

  function toggleAmenity(key: string, checked: boolean) {
    const next = checked ? [...filters.amenities, key] : filters.amenities.filter((a) => a !== key);
    onChange({ amenities: next });
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-foreground">Filters</h2>
        <button type="button" onClick={onClear} className="text-xs font-medium text-primary hover:underline">
          Clear all filters
        </button>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Property type</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {propertyTypeOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 text-sm text-foreground">
              <Checkbox
                checked={filters.propertyTypes.includes(opt.value)}
                onCheckedChange={(checked) => togglePropertyType(opt.value, checked === true)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Guests</Label>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-border px-3 py-1.5">
          <span className="text-sm text-foreground">Minimum guests</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChange({ guests: Math.max(1, filters.guests - 1) })}
              className="flex size-7 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted"
              aria-label="Decrease guests"
            >
              −
            </button>
            <span className="w-4 text-center text-sm font-medium text-foreground">{filters.guests}</span>
            <button
              type="button"
              onClick={() => onChange({ guests: Math.min(12, filters.guests + 1) })}
              className="flex size-7 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted"
              aria-label="Increase guests"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price per night</p>
          <span className="text-xs font-medium text-foreground">Up to {formatGHS(filters.maxPrice)}</span>
        </div>
        <Slider
          className="mt-4"
          min={bounds.min}
          max={bounds.max}
          step={20}
          value={[filters.maxPrice]}
          onValueChange={([value]) => onChange({ maxPrice: value })}
        />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bedrooms</p>
        <RadioGroup
          className="mt-3 flex flex-col gap-2.5"
          value={String(filters.bedrooms)}
          onValueChange={(value) => onChange({ bedrooms: Number(value) })}
        >
          {[0, 1, 2, 3, 4].map((n) => (
            <label key={n} className="flex items-center gap-2.5 text-sm text-foreground">
              <RadioGroupItem value={String(n)} />
              {n === 0 ? "Any" : n === 4 ? "4+" : n}
            </label>
          ))}
        </RadioGroup>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amenities</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {amenities.slice(0, 8).map((a) => (
            <label key={a.key} className="flex items-center gap-2.5 text-sm text-foreground">
              <Checkbox
                checked={filters.amenities.includes(a.key)}
                onCheckedChange={(checked) => toggleAmenity(a.key, checked === true)}
              />
              <CategoryIcon name={a.icon} className="size-3.5 text-muted-foreground" />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
        <Label htmlFor="instant-book-filter" className="text-sm font-medium text-foreground">
          Instant Book only
        </Label>
        <Switch
          id="instant-book-filter"
          checked={filters.instantBookOnly}
          onCheckedChange={(checked) => onChange({ instantBookOnly: checked })}
        />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rating</p>
        <RadioGroup
          className="mt-3 flex flex-col gap-2.5"
          value={filters.minRating ? String(filters.minRating) : ""}
          onValueChange={(value) => onChange({ minRating: value ? Number(value) : undefined })}
        >
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <RadioGroupItem value="" />
            Any rating
          </label>
          {[4, 3].map((r) => (
            <label key={r} className="flex items-center gap-2.5 text-sm text-foreground">
              <RadioGroupItem value={String(r)} />
              {r}★ &amp; up
            </label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
