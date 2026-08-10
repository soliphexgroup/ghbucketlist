// Approximate coordinates for the Accra-area neighbourhoods our stays sit in. Stays carry a
// `neighbourhood` string but no lat/lng, so we map the neighbourhood to a rough centroid — good
// enough to sort "nearby" listings and show an approximate distance. Not survey-grade.

export type LatLng = { lat: number; lng: number };

/** Central Accra — the fallback origin when we don't have the visitor's real location. */
export const ACCRA_CENTER: LatLng = { lat: 5.56, lng: -0.205 };

const NEIGHBOURHOOD_COORDS: Record<string, LatLng> = {
  osu: { lat: 5.556, lng: -0.182 },
  "east legon": { lat: 5.636, lng: -0.166 },
  cantonments: { lat: 5.572, lng: -0.175 },
  "airport residential": { lat: 5.605, lng: -0.177 },
  jamestown: { lat: 5.532, lng: -0.213 },
  labone: { lat: 5.562, lng: -0.17 },
  ridge: { lat: 5.568, lng: -0.197 },
  tesano: { lat: 5.608, lng: -0.228 },
  aburi: { lat: 5.847, lng: -0.174 },
};

/** Rough coordinates for a neighbourhood name, or null if we don't know it. */
export function neighbourhoodCoords(neighbourhood: string): LatLng | null {
  return NEIGHBOURHOOD_COORDS[neighbourhood.trim().toLowerCase()] ?? null;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
