export type CarFeature = {
  key: string;
  label: string;
  icon: string;
};

export const carFeatures: CarFeature[] = [
  { key: "ac", label: "Air Conditioning", icon: "Snowflake" },
  { key: "bluetooth", label: "Bluetooth Audio", icon: "Bluetooth" },
  { key: "gps", label: "GPS Navigation", icon: "MapPin" },
  { key: "backup-camera", label: "Backup Camera", icon: "Camera" },
  { key: "usb", label: "USB Charging", icon: "Usb" },
  { key: "sunroof", label: "Sunroof", icon: "Sun" },
  { key: "leather-seats", label: "Leather Seats", icon: "Armchair" },
  { key: "child-seat", label: "Child Seat Available", icon: "Baby" },
  { key: "roof-rack", label: "Roof Rack", icon: "PackagePlus" },
  { key: "four-wd", label: "4-Wheel Drive", icon: "Mountain" },
  { key: "cruise-control", label: "Cruise Control", icon: "Gauge" },
  { key: "keyless", label: "Keyless Entry", icon: "KeyRound" },
];

export function getCarFeature(key: string) {
  return carFeatures.find((f) => f.key === key);
}
