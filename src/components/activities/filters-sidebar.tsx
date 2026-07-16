"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/data/categories";
import { listNeighbourhoods, priceRangeBounds } from "@/lib/repository";
import { formatGHS } from "@/lib/format";
import type { ExperienceFilters } from "@/lib/repository";

export type FilterState = Required<
  Pick<ExperienceFilters, "q" | "categories" | "maxPrice" | "sort">
> &
  Pick<ExperienceFilters, "duration" | "neighbourhood" | "minRating" | "date" | "participants">;

const durationOptions: { value: NonNullable<FilterState["duration"]>; label: string }[] = [
  { value: "under1", label: "Under 1 hour" },
  { value: "1to2", label: "1–2 hours" },
  { value: "2to4", label: "2–4 hours" },
  { value: "half", label: "Half day" },
  { value: "full", label: "Full day" },
];

const ratingOptions = [
  { value: "4", label: "4★ & up" },
  { value: "3", label: "3★ & up" },
];

export function FiltersSidebar({
  filters,
  onChange,
  onClear,
}: {
  filters: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  onClear: () => void;
}) {
  const bounds = priceRangeBounds();
  const neighbourhoods = listNeighbourhoods();

  function toggleCategory(slug: string, checked: boolean) {
    const next = checked
      ? [...filters.categories, slug]
      : filters.categories.filter((c) => c !== slug);
    onChange({ categories: next });
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-foreground">Filters</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-primary hover:underline"
        >
          Clear all filters
        </button>
      </div>

      <div>
        <Label htmlFor="filter-search" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Search
        </Label>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="filter-search"
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Keyword…"
            className="pl-9"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Category
        </p>
        <div className="mt-3 flex flex-col gap-2.5">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-2.5 text-sm text-foreground"
            >
              <Checkbox
                checked={filters.categories.includes(category.slug)}
                onCheckedChange={(checked) => toggleCategory(category.slug, checked === true)}
              />
              {category.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Price range
          </p>
          <span className="text-xs font-medium text-foreground">
            Up to {formatGHS(filters.maxPrice)}
          </span>
        </div>
        <Slider
          className="mt-4"
          min={bounds.min}
          max={bounds.max}
          step={10}
          value={[filters.maxPrice]}
          onValueChange={([value]) => onChange({ maxPrice: value })}
        />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Duration
        </p>
        <RadioGroup
          className="mt-3 flex flex-col gap-2.5"
          value={filters.duration ?? ""}
          onValueChange={(value) =>
            onChange({ duration: (value || undefined) as FilterState["duration"] })
          }
        >
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <RadioGroupItem value="" />
            Any duration
          </label>
          {durationOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 text-sm text-foreground">
              <RadioGroupItem value={opt.value} />
              {opt.label}
            </label>
          ))}
        </RadioGroup>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Neighbourhood
        </p>
        <Select
          value={filters.neighbourhood ?? "any"}
          onValueChange={(value) => onChange({ neighbourhood: value === "any" ? undefined : value })}
        >
          <SelectTrigger className="mt-3 w-full">
            <SelectValue placeholder="Any neighbourhood" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any neighbourhood</SelectItem>
            {neighbourhoods.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Rating
        </p>
        <RadioGroup
          className="mt-3 flex flex-col gap-2.5"
          value={filters.minRating ? String(filters.minRating) : ""}
          onValueChange={(value) => onChange({ minRating: value ? Number(value) : undefined })}
        >
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <RadioGroupItem value="" />
            Any rating
          </label>
          {ratingOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 text-sm text-foreground">
              <RadioGroupItem value={opt.value} />
              {opt.label}
            </label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
