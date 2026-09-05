// Static Paleobiology Database export, baked by `npm run data:pbdb`.
// Nothing here touches the network beyond the app's own origin.

import type { DataProvenance } from "../core/types";

export type EnvClass = "sea" | "coast" | "fresh" | "land" | "unknown";

export interface PbdbSite {
  paleoLng: number;
  paleoLat: number;
  lng: number;
  lat: number;
  env: EnvClass;
  /** Recorded occurrences at this site. Not a number of individuals. */
  count: number;
}

export interface PbdbStageSites {
  stage: string;
  earlyMa: number | null;
  lateMa: number | null;
  sites: PbdbSite[];
}

export interface PbdbFormation {
  formation: string;
  group: string | null;
  earlyMa: number;
  lateMa: number;
  midMa: number;
  /** Number of fossil sites recorded in this formation. */
  sites: number;
  /** Recorded occurrences across those sites. Not a number of individuals. */
  count: number;
  env: Array<[EnvClass, number]>;
  lng: number;
  lat: number;
  paleoLng: number;
  paleoLat: number;
}

export interface PbdbFormations {
  provenance: DataProvenance;
  formations: PbdbFormation[];
}

/**
 * Environment classes, ordered from open sea to dry land. The order is the
 * legend order and the colour ramp order; keep them in step.
 */
export const ENV_ORDER: readonly EnvClass[] = ["sea", "coast", "fresh", "land", "unknown"];

export const ENV_LABEL: Record<EnvClass, string> = {
  sea: "SEA",
  coast: "COAST · DELTA",
  fresh: "RIVER · LAKE",
  land: "DRY LAND",
  unknown: "NOT RECORDED",
};

export const ENV_COLOR: Record<EnvClass, string> = {
  sea: "#378add",
  coast: "#1d9e75",
  fresh: "#97c459",
  land: "#ef9f27",
  unknown: "#6f7b7a",
};

type RawStage = {
  stage: string;
  earlyMa: number | null;
  lateMa: number | null;
  sites: Array<[number, number, number, number, EnvClass, number]>;
};

/** Where one creature in the app is dug up today. */
export interface TaxonTrace {
  id: string;
  region: string;
  genus: string;
  /** Distinct published localities. Not a number of animals. */
  sites: number;
  countries: string[];
  mainCountry: string;
  mainCountrySites: number;
  /**
   * Median distance from the centre of the locality cloud, now and at the time.
   * A creature on one plate barely changes — the plate moves as a piece — while
   * one spread over several draws together, because the oceans between them
   * were narrower.
   */
  spreadKm: number;
  paleoSpreadKm: number;
  lat: number;
  lng: number;
  /** `[lng, lat, paleoLng, paleoLat]` for every distinct published locality. */
  localities: Array<[number, number, number, number]>;
}

export interface TaxonTraces {
  provenance: DataProvenance;
  taxa: Record<string, TaxonTrace>;
}

const stageCache = new Map<string, Promise<PbdbStageSites>>();
let taxonTraceCache: Promise<TaxonTraces> | null = null;
let formationsCache: Promise<PbdbFormations> | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!response.ok) throw new Error(`${path} unavailable (${response.status})`);
  return await response.json() as T;
}

export function loadStageSites(stageId: string): Promise<PbdbStageSites> {
  let pending = stageCache.get(stageId);
  if (!pending) {
    pending = fetchJson<RawStage>(`data/pbdb/sites-${stageId}.json`).then((raw) => ({
      stage: raw.stage,
      earlyMa: raw.earlyMa,
      lateMa: raw.lateMa,
      sites: raw.sites.map(([paleoLng, paleoLat, lng, lat, env, count]) => ({ paleoLng, paleoLat, lng, lat, env, count })),
    }));
    stageCache.set(stageId, pending);
  }
  return pending;
}

export function loadTaxonTraces(): Promise<TaxonTraces> {
  taxonTraceCache ??= fetchJson<TaxonTraces>("data/pbdb/taxon-traces.json");
  return taxonTraceCache;
}

export function loadFormations(): Promise<PbdbFormations> {
  formationsCache ??= fetchJson<PbdbFormations>("data/pbdb/formations.json");
  return formationsCache;
}

const EARTH_RADIUS_KM = 6371;

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = Math.PI / 180;
  const dLat = (bLat - aLat) * toRad;
  const dLng = (bLng - aLng) * toRad;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(aLat * toRad) * Math.cos(bLat * toRad) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface ColumnBand extends PbdbFormation {
  distanceKm: number;
  dominantEnv: EnvClass;
}

/**
 * The stratigraphic column for a modern place: every formation with recorded
 * fossils near it, youngest first. Formations are placed by the centroid of
 * their recorded sites, so a formation that crops out over a wide area is
 * matched by its centre of record, not by its full extent.
 */
export function buildColumn(formations: readonly PbdbFormation[], lat: number, lng: number, radiusKm: number): ColumnBand[] {
  const bands: ColumnBand[] = [];
  for (const formation of formations) {
    const distance = distanceKm(lat, lng, formation.lat, formation.lng);
    if (distance > radiusKm) continue;
    bands.push({ ...formation, distanceKm: distance, dominantEnv: formation.env[0]?.[0] ?? "unknown" });
  }
  return bands.sort((a, b) => a.midMa - b.midMa);
}
