// Where each creature in the app is dug up today.
//
// The ancient side knows where a creature lived. This is the other half: the
// modern places its remains come out of. Run after changing the taxon list.
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

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function fetchTaxon({ id, region, genus }) {
  const url = `${BASE}/occs/list.json?base_name=${encodeURIComponent(genus)}&show=loc,coords&limit=5000&datainfo`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PBDB request failed (${response.status}) for ${genus}`);
  const body = await response.json();
  const records = body.records ?? [];

  const seen = new Map();
  for (const record of records) {
    if (record.lng == null || record.lat == null) continue;
    const lng = round(Number(record.lng), 3);
    const lat = round(Number(record.lat), 3);
    const key = `${lng},${lat}`;
    if (!seen.has(key)) seen.set(key, { lng, lat, country: record.cc2 ?? null });
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
    sites: localities.length,
    countries: [...byCountry.keys()].filter(Boolean),
    mainCountry: country,
    mainCountrySites: cluster.length,
    lat: round(cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length, 3),
    lng: round(cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length, 3),
    localities: localities.map((p) => [p.lng, p.lat]),
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
  console.log(`  ${taxon.genus.padEnd(20)} ${String(row.sites).padStart(4)} sites  ${row.countries.length} countries  main ${row.mainCountry}`);
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
      "Modern localities for each taxon in the app, all occurrences of the genus. " +
      "`sites` counts distinct published localities, not individuals. The marker sits in " +
      "the largest national cluster because the centroid of a wide range falls nowhere real.",
  },
  taxa: traces,
}, null, 1));
console.log(`\n-> ${OUT}`);
