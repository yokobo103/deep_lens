// Turn the gate definitions into everything a gate needs to be entered.
//
//   npm run data:gates
//
// Reads src/data/gates.ts, asks PBDB for each gate's records, and writes one
// file per gate plus a manifest. Adding a world means adding a definition and
// running this; nothing downstream is hand-maintained.
//
// Per gate rather than per age on purpose. A global bake of every stage back to
// 540 Ma runs past twenty megabytes, and almost all of it is the scatter of
// points that this app decided not to make the subject. What a gate needs is
// its own localities and its own cast, which is tens of kilobytes.
//
// Seeing the rest of the world at one age does not need that bake either: gates
// carry a band, and the other gates of a band are simply the ones sharing it.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "src", "data", "gates.ts");
const OUT_DIR = join(ROOT, "public", "data", "gates");
const BASE = "https://paleobiodb.org/data1.2";

/** How many named creatures a gate carries. Beyond this it becomes a list. */
const CAST_LIMIT = 14;

/**
 * Read the definitions out of the TypeScript rather than duplicating them.
 * A second copy of this list is a second thing to forget to update.
 */
async function readGates() {
  const source = await readFile(SOURCE, "utf8");
  const body = source.slice(source.indexOf("export const gateDefinitions"));
  const gates = [];
  for (const block of body.split(/\n  \{\n/).slice(1)) {
    const id = block.match(/id:\s*"([^"]+)"/)?.[1];
    if (!id) continue;
    const stratum = block.match(/stratum:\s*"([^"]+)"/)?.[1];
    const box = block.match(/box:\s*\{\s*west:\s*(-?[\d.]+),\s*east:\s*(-?[\d.]+),\s*south:\s*(-?[\d.]+),\s*north:\s*(-?[\d.]+)/);
    const age = block.match(/ageMa:\s*\{\s*from:\s*([\d.]+),\s*to:\s*([\d.]+)/);
    gates.push({
      id,
      band: block.match(/band:\s*"([^"]+)"/)?.[1],
      stratum,
      box: box ? { west: +box[1], east: +box[2], south: +box[3], north: +box[4] } : undefined,
      from: age ? +age[1] : null,
      to: age ? +age[2] : null,
    });
  }
  return gates;
}

function collectionUrl({ stratum, box }, show) {
  const parameters = [`show=${show}`, "pgm=scotese", "limit=10000"];
  if (stratum) parameters.push(`strat=${encodeURIComponent(stratum)}`);
  if (box) parameters.push(`lngmin=${box.west}`, `lngmax=${box.east}`, `latmin=${box.south}`, `latmax=${box.north}`);
  return `${BASE}/colls/list.json?${parameters.join("&")}`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PBDB request failed (${response.status}): ${url}`);
  const body = await response.json();
  if (body.errors) throw new Error(`PBDB error: ${JSON.stringify(body.errors)}`);
  return body;
}

const round = (value, digits) => Math.round(value * 10 ** digits) / 10 ** digits;

/** Records whose age midpoint falls inside the gate's window. */
function inWindow(record, gate) {
  const early = Number(record.eag);
  const late = Number(record.lag);
  if (!Number.isFinite(early) || !Number.isFinite(late)) return false;
  const middle = (early + late) / 2;
  return middle <= gate.from && middle >= gate.to;
}

function centreOfLargestCluster(localities) {
  const byCountry = new Map();
  for (const point of localities) {
    byCountry.set(point.country, [...(byCountry.get(point.country) ?? []), point]);
  }
  const [country, cluster] = [...byCountry.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  const mean = (pick) => cluster.reduce((sum, point) => sum + pick(point), 0) / cluster.length;
  return {
    country,
    countrySites: cluster.length,
    lat: round(mean((p) => p.lat), 3),
    lng: round(mean((p) => p.lng), 3),
    paleoLat: round(mean((p) => p.paleoLat), 2),
    paleoLng: round(mean((p) => p.paleoLng), 2),
  };
}

async function buildGate(gate) {
  const body = await fetchJson(collectionUrl(gate, "loc,coords,paleoloc,strat,env,time"));
  const seen = new Map();
  const environments = new Map();
  const formations = new Map();
  let ageSum = 0;
  let ageCount = 0;

  for (const record of body.records ?? []) {
    if (!inWindow(record, gate)) continue;
    if (record.lng == null || record.lat == null || record.pln == null || record.pla == null) continue;
    ageSum += (Number(record.eag) + Number(record.lag)) / 2;
    ageCount += 1;
    if (record.env) environments.set(record.env, (environments.get(record.env) ?? 0) + 1);
    if (record.sfm) formations.set(record.sfm, (formations.get(record.sfm) ?? 0) + 1);
    const lng = round(Number(record.lng), 3);
    const lat = round(Number(record.lat), 3);
    const key = `${lng},${lat}`;
    if (!seen.has(key)) {
      seen.set(key, { lng, lat, paleoLng: round(Number(record.pln), 2), paleoLat: round(Number(record.pla), 2), country: record.cc2 ?? null });
    }
  }

  const localities = [...seen.values()];
  if (localities.length === 0) return null;

  // The cast: who is actually recorded here, most-recorded first. Named species
  // only — an occurrence identified no further than "Theropoda" is a record of
  // not knowing, and belongs in the count rather than in a list of creatures.
  const occurrences = await fetchJson(`${BASE}/occs/list.json?${collectionUrl(gate, "class,ident,time").split("?")[1]}`);
  const cast = new Map();
  let occurrenceCount = 0;
  for (const record of occurrences.records ?? []) {
    if (!inWindow(record, gate)) continue;
    occurrenceCount += 1;
    const name = record.tna;
    if (!name || !name.includes(" ") || record.rnk !== 3) continue;
    const entry = cast.get(name) ?? { name, group: record.cll ?? record.phl ?? null, count: 0 };
    entry.count += 1;
    cast.set(name, entry);
  }

  return {
    id: gate.id,
    band: gate.band,
    sites: localities.length,
    occurrences: occurrenceCount,
    medianAgeMa: ageCount ? round(ageSum / ageCount, 1) : null,
    environments: [...environments.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    formations: [...formations.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    cast: [...cast.values()].sort((a, b) => b.count - a.count).slice(0, CAST_LIMIT),
    castTotal: cast.size,
    ...centreOfLargestCluster(localities),
    localities: localities.map((p) => [p.lng, p.lat, p.paleoLng, p.paleoLat]),
    accessTime: body.access_time,
    license: body.data_license,
  };
}

const gates = await readGates();
console.log(`${gates.length} gates read from gates.ts\n`);

await mkdir(OUT_DIR, { recursive: true });
const manifest = [];
let license = null;
let accessTime = null;

for (const gate of gates) {
  const built = await buildGate(gate);
  if (!built) {
    console.log(`  ${gate.id.padEnd(18)} no records in window — check the query or the age`);
    continue;
  }
  license ??= built.license;
  accessTime ??= built.accessTime;
  const { accessTime: _a, license: _l, ...row } = built;
  await writeFile(join(OUT_DIR, `${gate.id}.json`), JSON.stringify(row));
  manifest.push({
    id: row.id, band: row.band, sites: row.sites, occurrences: row.occurrences,
    medianAgeMa: row.medianAgeMa, cast: row.cast.length,
    lat: row.lat, lng: row.lng, paleoLat: row.paleoLat, paleoLng: row.paleoLng,
  });
  console.log(
    `  ${gate.id.padEnd(18)} ${String(row.sites).padStart(4)} sites ${String(row.occurrences).padStart(5)} records ` +
    `${String(row.cast.length).padStart(3)} named  ${String(row.medianAgeMa).padStart(5)} Ma  ` +
    `now ${row.lat.toFixed(1).padStart(6)}N ${row.lng.toFixed(1).padStart(7)}E -> then ${row.paleoLat.toFixed(1).padStart(6)}N ${row.paleoLng.toFixed(1).padStart(7)}E`,
  );
}

await writeFile(join(OUT_DIR, "manifest.json"), JSON.stringify({
  provenance: {
    source: "The Paleobiology Database",
    sourceUrl: "https://paleobiodb.org/",
    license,
    updatedAt: accessTime,
    confidence: "medium",
    dataKind: "real",
    note:
      "One file per gate. `sites` counts distinct published localities and `occurrences` counts " +
      "published records, neither of which is a number of animals — both follow where people have " +
      "dug. Paleocoordinates are PBDB's PALEOMAP reconstruction at each record's own mid-age.",
  },
  gates: manifest,
}, null, 1));

const total = manifest.reduce((sum, gate) => sum + gate.sites, 0);
console.log(`\n${manifest.length} gates, ${total} localities -> ${OUT_DIR}`);
