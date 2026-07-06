export type Amenity = {
  key: string;
  label: string;
  icon: string;
};

export const amenities: Amenity[] = [
  { key: "wifi", label: "WiFi", icon: "Wifi" },
  { key: "pool", label: "Pool", icon: "Waves" },
  { key: "kitchen", label: "Kitchen", icon: "CookingPot" },
  { key: "parking", label: "Free Parking", icon: "SquareParking" },
  { key: "ac", label: "Air Conditioning", icon: "Snowflake" },
  { key: "gym", label: "Gym", icon: "Dumbbell" },
  { key: "washer", label: "Washer / Dryer", icon: "WashingMachine" },
  { key: "tv", label: "TV", icon: "Tv" },
  { key: "hotwater", label: "Hot Water", icon: "Droplets" },
  { key: "workspace", label: "Dedicated Workspace", icon: "Laptop" },
  { key: "security", label: "24/7 Security", icon: "ShieldCheck" },
  { key: "cctv", label: "CCTV", icon: "Camera" },
  { key: "generator", label: "Backup Generator", icon: "Zap" },
  { key: "petfriendly", label: "Pet Friendly", icon: "PawPrint" },
  { key: "balcony", label: "Balcony", icon: "DoorOpen" },
  { key: "garden", label: "Garden", icon: "Trees" },
];

export function getAmenity(key: string) {
  return amenities.find((a) => a.key === key);
}
