/** Facilities are shown grouped by this, in the order listed in `amenityGroups`. */
export type AmenityGroup = "general" | "kitchen_laundry" | "outdoor" | "wellness" | "safety";

export type Amenity = {
  key: string;
  label: string;
  icon: string;
  group: AmenityGroup;
};

export const amenityGroups: { key: AmenityGroup; label: string }[] = [
  { key: "general", label: "General" },
  { key: "kitchen_laundry", label: "Kitchen & laundry" },
  { key: "outdoor", label: "Outdoors" },
  { key: "wellness", label: "Wellness" },
  { key: "safety", label: "Safety & power" },
];

export const amenities: Amenity[] = [
  { key: "wifi", label: "WiFi", icon: "Wifi", group: "general" },
  { key: "ac", label: "Air Conditioning", icon: "Snowflake", group: "general" },
  { key: "tv", label: "TV", icon: "Tv", group: "general" },
  { key: "hotwater", label: "Hot Water", icon: "Droplets", group: "general" },
  { key: "workspace", label: "Dedicated Workspace", icon: "Laptop", group: "general" },
  { key: "parking", label: "Free Parking", icon: "SquareParking", group: "general" },
  { key: "petfriendly", label: "Pet Friendly", icon: "PawPrint", group: "general" },

  { key: "kitchen", label: "Kitchen", icon: "CookingPot", group: "kitchen_laundry" },
  { key: "washer", label: "Washer / Dryer", icon: "WashingMachine", group: "kitchen_laundry" },

  { key: "balcony", label: "Balcony", icon: "DoorOpen", group: "outdoor" },
  { key: "garden", label: "Garden", icon: "Trees", group: "outdoor" },

  { key: "pool", label: "Pool", icon: "Waves", group: "wellness" },
  { key: "gym", label: "Gym", icon: "Dumbbell", group: "wellness" },

  { key: "security", label: "24/7 Security", icon: "ShieldCheck", group: "safety" },
  { key: "cctv", label: "CCTV", icon: "Camera", group: "safety" },
  { key: "generator", label: "Backup Generator", icon: "Zap", group: "safety" },
];

export function getAmenity(key: string) {
  return amenities.find((a) => a.key === key);
}

/** Groups a property's amenity keys, dropping groups it has nothing in. */
export function groupAmenities(keys: string[]) {
  const owned = keys.map(getAmenity).filter((a): a is Amenity => Boolean(a));
  return amenityGroups
    .map((group) => ({ ...group, items: owned.filter((a) => a.group === group.key) }))
    .filter((group) => group.items.length > 0);
}
