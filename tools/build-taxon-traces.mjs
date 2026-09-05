// Where each creature in the app is dug up today, and where that ground sat
// while the animal was alive.
//
// Both positions are kept for every locality, because the shape of the bundle
// between them turns out to be the interesting part. Measured 2026-09-05:
// a creature confined to one plate does not close up at all when you wind the
// clock back — Spinosaurus spans 1,180 km today and spanned 1,205 km at the
// time, because the plate moved as one piece. Only creatures spread across
// several plates draw together: Baculites goes 4,181 km to 2,894 km, because
// the Atlantic had not finished opening. Parallel tracks or converging ones.
//
// Run after changing the taxon list.
//
//   npm run data:taxa
//
// The taxa are read from src/data/ancientLife.ts so the two cannot drift apart.
// Runtime stays offline; this writes a static file.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "src", "data", "ancientLife.ts");
const OUT = join(ROOT, "public", "data", "pbdb", "taxon-traces.json");
const BASE = "https://paleobiodb.org/data1.2";

/**
 * The named rock unit behind each region, so a crossing started from a region
 * marker has localities to carry too. Without these, picking a region and
 * crossing showed a single point moving and nothing else.
 */
const REGION_STRATA = {
  "kem-kem": "Kem Kem",
  huincul: "Huincul",
  winton: "Winton",
  greenhorn: "Greenhorn",
};

/** `id` and the genus to ask PBDB about, for every taxon record in the app. */
async function readTaxa() {
  const source = await readFile(SOURCE, "utf8");
  const taxa = [];
  for (const block of source.split(/\{\s*\n\s*id:/).slice(1)) {
    const id = block.match(/^\s*"([^"]+)"/)?.[1];
    const name = block.match(/name:\s*"([^"]+)"/)?.[1];
    const kind = block.match(/recordType:\s*"([^"]+)"/)?.[1];
    const region = block.match(/regionId:\s*"([^"]+)"/)?.[1];
    if (!id || !name || kind !== "taxon") continue;
    taxa.push({ id, region, genus: name.split(" ")[0] });
  }
  return taxa;
}

/** Median great-circle distance from the centre of a cloud of points. */
function spread(points) {
  if (points.length < 2) return 0;
  const centreLng = points.reduce((sum, [lng]) => sum + lng, 0) / points.length;
  const centreLat = points.reduce((sum, [, lat]) => sum + lat, 0) / points.length;
  const rad = Math.PI / 180;
  const distances = points.map(([lng, lat]) => {
    const dLat = (lat - centreLat) * rad;
    const dLng = (lng - centreLng) * rad;
    const h = Math.sin(dLat / 2) ** 2
      + Math.cos(centreLat * rad) * Math.cos(lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
  }).sort((a, b) => a - b);
  return distances[Math.floor(distances.length / 2)];
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function fetchLocalities(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PBDB request failed (${response.status})`);
  const body = await response.json();
  const seen = new Map();
  for (const record of body.records ?? []) {
    if (record.lng == null || record.lat == null || record.pln == null || record.pla == null) continue;
    const lng = round(Number(record.lng), 3);
    const lat = round(Number(record.lat), 3);
    const key = `${lng},${lat}`;
    if (!seen.has(key)) {
      seen.set(key, {
        lng, lat,
        paleoLng: round(Number(record.pln), 2),
        paleoLat: round(Number(record.pla), 2),
        country: record.cc2 ?? null,
      });
    }
  }
  return { localities: [...seen.values()], body };
}

async function fetchRegion(regionId, stratum) {
  const url = `${BASE}/colls/list.json?strat=${encodeURIComponent(stratum)}&show=loc,coords,paleoloc&pgm=scotese&limit=5000`;
  const { localities } = await fetchLocalities(url);
  if (localities.length === 0) return null;
  return {
    id: regionId,
    stratum,
    sites: localities.length,
    spreadKm: Math.round(spread(localities.map((p) => [p.lng, p.lat]))),
    paleoSpreadKm: Math.round(spread(localities.map((p) => [p.paleoLng, p.paleoLat]))),
    localities: localities.map((p) => [p.lng, p.lat, p.paleoLng, p.paleoLat]),
  };
}

async function fetchTaxon({ id, region, genus }) {
  const url = `${BASE}/occs/list.json?base_name=${encodeURIComponent(genus)}&show=loc,coords,paleoloc&pgm=scotese&limit=5000&datainfo`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PBDB request failed (${response.status}) for ${genus}`);
  const body = await response.json();
  const records = body.records ?? [];

  const seen = new Map();
  for (const record of records) {
    if (record.lng == null || record.lat == null || record.pln == null || record.pla == null) continue;
    const lng = round(Number(record.lng), 3);
    const lat = round(Number(record.lat), 3);
    const key = `${lng},${lat}`;
    if (!seen.has(key)) {
      seen.set(key, {
        lng, lat,
        paleoLng: round(Number(record.pln), 2),
        paleoLat: round(Number(record.pla), 2),
        country: record.cc2 ?? null,
      });
    }
  }
  const localities = [...seen.values()];
  if (localities.length === 0) return null;

  const byCountry = new Map();
  for (const point of localities) {
    byCountry.set(point.country, [...(byCountry.get(point.country) ?? []), point]);
  }
  const [country, cluster] = [...byCountry.entries()].sort((a, b) => b[1].length - a[1].length)[0];

  // The marker sits in the largest cluster, not at the centroid of everything:
  // averaging six countries puts a creature in the middle of an empty sea.
  return {
    id,
    region,
    genus,
    /** Median distance from the centre of the cloud, then and now. */
    spreadKm: Math.round(spread(localities.map((p) => [p.lng, p.lat]))),
    paleoSpreadKm: Math.round(spread(localities.map((p) => [p.paleoLng, p.paleoLat]))),
    sites: localities.length,
    countries: [...byCountry.keys()].filter(Boolean),
    mainCountry: country,
    mainCountrySites: cluster.length,
    lat: round(cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length, 3),
    lng: round(cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length, 3),
    localities: localities.map((p) => [p.lng, p.lat, p.paleoLng, p.paleoLat]),
    accessTime: body.access_time,
    license: body.data_license,
  };
}

const taxa = await readTaxa();
console.log(`${taxa.length} taxa read from ancientLife.ts`);

const traces = {};
let license = null;
let accessTime = null;
for (const taxon of taxa) {
  const result = await fetchTaxon(taxon);
  if (!result) {
    console.log(`  ${taxon.genus.padEnd(20)} no coordinates, skipped`);
    continue;
  }
  license ??= result.license;
  accessTime ??= result.accessTime;
  const { accessTime: _a, license: _l, ...row } = result;
  traces[taxon.id] = row;
  console.log(`  ${taxon.genus.padEnd(20)} ${String(row.sites).padStart(4)} sites  ${String(row.countries.length).padStart(2)} countries  spread ${String(row.spreadKm).padStart(5)} km now / ${String(row.paleoSpreadKm).padStart(5)} km then`);
}

const regions = {};
for (const [regionId, stratum] of Object.entries(REGION_STRATA)) {
  const row = await fetchRegion(regionId, stratum);
  if (!row) {
    console.log(`  region ${regionId.padEnd(14)} no localities`);
    continue;
  }
  regions[regionId] = row;
  console.log(`  region ${regionId.padEnd(14)} ${String(row.sites).padStart(4)} sites  spread ${String(row.spreadKm).padStart(5)} km now / ${String(row.paleoSpreadKm).padStart(5)} km then`);
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({
  provenance: {
    source: "The Paleobiology Database",
    sourceUrl: "https://paleobiodb.org/",
    license,
    updatedAt: accessTime,
    confidence: "medium",
    dataKind: "real",
    note:
      "Localities for each taxon in the app, all occurrences of the genus, with both the " +
      "modern position and PBDB's PALEOMAP reconstruction of where that ground sat at the " +
      "time. `sites` counts distinct published localities, not individuals. The marker sits " +
      "in the largest national cluster because the centroid of a wide range falls nowhere real.",
  },
  taxa: traces,
  regions,
}, null, 1));
console.log(`\n-> ${OUT}`);
