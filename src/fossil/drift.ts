/**
 * The drift: the one move that carries a place from the world it lived in to
 * the world it is found in. The place does not go anywhere — the Earth does.
 * The camera stays on the point, a ghost stays where the point used to be, and
 * the distance between them is the whole argument of this app.
 */

import type { FossilTimeMode } from "../components/TimeModeToggle";

export interface DriftPoint {
  lat: number;
  lng: number;
}

export type DriftPhase = "swap" | "done";

export interface DriftPlan {
  /** Bumped on every request so a repeat of the same journey still runs. */
  key: number;
  direction: "to-present" | "to-ancient";
  targetMode: FossilTimeMode;
  /**
   * The creature being carried, if it is a single taxon. Held here rather than
   * read from the selection, because starting a drift clears the selection to
   * put the card away — and the localities must survive that.
   */
  taxonId: string | null;
  /** Falls back to the whole rock unit when no single creature is chosen. */
  regionId: string | null;
  from: DriftPoint;
  to: DriftPoint;
  fromIcon: string;
  toIcon: string;
  fromLabel: string;
  toLabel: string;
  fromAgeLabel: string;
  toAgeLabel: string;
  distanceKm: number;
}

const EARTH_RADIUS_KM = 6371;
const DEG = Math.PI / 180;

export function driftDistanceKm(from: DriftPoint, to: DriftPoint): number {
  const dLat = (to.lat - from.lat) * DEG;
  const dLng = (to.lng - from.lng) * DEG;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(from.lat * DEG) * Math.cos(to.lat * DEG) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toVector({ lat, lng }: DriftPoint): [number, number, number] {
  const a = lat * DEG;
  const b = lng * DEG;
  return [Math.cos(a) * Math.cos(b), Math.cos(a) * Math.sin(b), Math.sin(a)];
}

/**
 * Great-circle interpolation. Walking the straight line in degrees would drag
 * the point across latitudes it never occupied, which is exactly the kind of
 * quiet fiction this app is not allowed to draw.
 */
export function interpolateDrift(from: DriftPoint, to: DriftPoint, t: number): DriftPoint {
  const a = toVector(from);
  const b = toVector(to);
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-6) return { lat: to.lat, lng: to.lng };
  const sin = Math.sin(omega);
  const wa = Math.sin((1 - t) * omega) / sin;
  const wb = Math.sin(t * omega) / sin;
  const x = a[0] * wa + b[0] * wb;
  const y = a[1] * wa + b[1] * wb;
  const z = a[2] * wa + b[2] * wb;
  return {
    lat: Math.atan2(z, Math.hypot(x, y)) / DEG,
    lng: Math.atan2(y, x) / DEG,
  };
}

export function formatLatitude(value: number, locale: "ja" | "en"): string {
  const hemisphere = value >= 0 ? (locale === "ja" ? "N" : "N") : "S";
  return `${Math.abs(value).toFixed(1)}°${hemisphere}`;
}

/** Beat boundaries in milliseconds from the start of the drift. */
export const DRIFT_BEATS = {
  /** Everything but the chosen place dims. Nothing has moved yet. */
  hold: 340,
  /** The world swaps under the point while the point travels. */
  travelEnd: 1680,
  /** Alive becomes bone. */
  morphEnd: 2080,
  /** The camera finally comes down over the place. */
  settleEnd: 2780,
} as const;

export const DRIFT_TRAVEL_HEIGHT = 12_000_000;

/** Samples along the line drawn between the two ages. */
export const DRIFT_TRAIL_SAMPLES = 24;
