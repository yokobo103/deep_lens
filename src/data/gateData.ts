// The baked gates, read at runtime. Written by `npm run data:gates`.

import type { DataProvenance } from "../core/types";

export interface GateSummary {
  id: string;
  band: string;
  /** Distinct published localities. Not a number of animals. */
  sites: number;
  /** Published records. Follows where people have dug. */
  occurrences: number;
  medianAgeMa: number | null;
  lat: number;
  lng: number;
  paleoLat: number;
  paleoLng: number;
  cast: number;
}

export interface GateManifest {
  provenance: DataProvenance;
  gates: GateSummary[];
}

export interface CastMember {
  name: string;
  group: string | null;
  count: number;
}

export interface GateDetail extends Omit<GateSummary, "cast"> {
  environments: Array<[string, number]>;
  formations: Array<[string, number]>;
  cast: CastMember[];
  castTotal: number;
  country: string;
  countrySites: number;
  /** `[lng, lat, paleoLng, paleoLat]` for every locality. */
  localities: Array<[number, number, number, number]>;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!response.ok) throw new Error(`${path} unavailable (${response.status})`);
  return await response.json() as T;
}

let manifestCache: Promise<GateManifest> | null = null;
const detailCache = new Map<string, Promise<GateDetail>>();

export function loadGateManifest(): Promise<GateManifest> {
  manifestCache ??= fetchJson<GateManifest>("data/gates/manifest.json");
  return manifestCache;
}

/** A gate's own file, fetched only when that gate is opened. */
export function loadGate(id: string): Promise<GateDetail> {
  let pending = detailCache.get(id);
  if (!pending) {
    pending = fetchJson<GateDetail>(`data/gates/${id}.json`);
    detailCache.set(id, pending);
  }
  return pending;
}
