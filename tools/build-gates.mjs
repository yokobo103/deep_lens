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

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { readGates, GATES_SOURCE } from "./gates-source.mjs";

// Cast entries PBDB places nowhere. Printed at the end so the gap is visible.
const placeless = new Set();
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "data", "gates");
const BASE = "https://paleobiodb.org/data1.2";

/** How many named creatures a gate carries. Beyond this it becomes a list. */
const CAST_LIMIT = 14;

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
    if (record.lng == null || record.lat == null) continue;
    // Below a few million years the reconstruction is not worth asking for, and
    // asking anyway is worse than not asking. Plates move about five
    // centimetres a year, so at 5 Ma the ground has gone perhaps 25 km — less
    // than this app can draw. Meanwhile PBDB gives paleocoordinates for none of
    // Naracoorte's ten Pleistocene collections and for three of La Brea's
    // forty-six, two of which are wrong: one puts a tar pit 700 km inland and
    // the other 4,300 km out in the Pacific off Ecuador, for ground that has
    // had seventy thousand years to move about four metres.
    //
    // So under 5 Ma the present position is the reconstruction, and is used as
    // one. Above it, a record with no reconstruction is skipped as before.
    const recent = (Number(record.eag) + Number(record.lag)) / 2 < 5;
    const reconstructed = !recent && record.pln != null && record.pla != null;
    if (!recent && !reconstructed) continue;
    ageSum += (Number(record.eag) + Number(record.lag)) / 2;
    ageCount += 1;
    if (record.env) environments.set(record.env, (environments.get(record.env) ?? 0) + 1);
    if (record.sfm) formations.set(record.sfm, (formations.get(record.sfm) ?? 0) + 1);
    const lng = round(Number(record.lng), 3);
    const lat = round(Number(record.lat), 3);
    const key = `${lng},${lat}`;
    if (!seen.has(key)) {
      seen.set(key, { lng, lat, paleoLng: reconstructed ? round(Number(record.pln), 2) : lng, paleoLat: reconstructed ? round(Number(record.pla), 2) : lat, country: record.cc2 ?? null });
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

  // What PBDB's describers recorded about where each of them lived. Stored raw,
  // not classified: the folding into bands a picture can show is the app's
  // reading and belongs where it can be changed without re-baking, and keeping
  // the original strings means the reading can always be checked against them.
  // Asked once per gate for the cast that is kept, never for the whole tail.
  const shortlist = [...cast.values()].sort((a, b) => b.count - a.count).slice(0, CAST_LIMIT);
  const genera = [...new Set(shortlist.map((entry) => entry.name.split(" ")[0].replace(/[()]/g, "")))];
  if (genera.length > 0) {
    const taxa = await fetchJson(`${BASE}/taxa/list.json?show=ecospace,class&name=${encodeURIComponent(genera.join(","))}`);
    const ecospace = new Map((taxa.records ?? []).map((record) => [record.nam, record]));
    for (const entry of shortlist) {
      const taxon = ecospace.get(entry.name.split(" ")[0].replace(/[()]/g, ""));
      if (taxon?.phl) entry.phylum = taxon.phl;
      // I = ichnotaxon (a footprint), F = form taxon (an eggshell, a detached
      // organ). A name like Macroolithus is a record of an egg, not of an
      // animal standing somewhere, and it was landing in "on land".
      if (taxon?.flg) entry.form = taxon.flg;
      if (taxon?.jev) entry.env = taxon.jev;
      if (taxon?.jlh) entry.habit = taxon.jlh;
      if (!taxon?.jev && !taxon?.jlh) placeless.add(`${gate.id}: ${entry.name}`);
    }
  }

  // Two requests, two ways to come back empty. PBDB has answered the collections
  // query and returned nothing for the occurrences query in the same minute, and
  // a gate built from that half is a world with ground and nobody on it — which
  // would be written out as a success. No gate in this app has zero occurrences,
  // so zero means the question did not get answered.
  if (occurrenceCount === 0) return null;

  return {
    id: gate.id,
    band: gate.band,
    sites: localities.length,
    occurrences: occurrenceCount,
    medianAgeMa: ageCount ? round(ageSum / ageCount, 1) : null,
    environments: [...environments.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    formations: [...formations.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    cast: shortlist,
    castTotal: cast.size,
    ...centreOfLargestCluster(localities),
    localities: localities.map((p) => [p.lng, p.lat, p.paleoLng, p.paleoLat]),
    accessTime: body.access_time,
    license: body.data_license,
  };
}

const gates = await readGates();
console.log(`${gates.length} gates read from gates.ts\n`);

// Reading nothing is a broken parser, never an empty app. Writing the manifest
// anyway replaces every baked gate with an empty list and reports success.
if (gates.length === 0) {
  throw new Error(`No gates parsed from ${GATES_SOURCE}. Refusing to write an empty manifest over the baked data.`);
}

await mkdir(OUT_DIR, { recursive: true });
const manifest = [];
/** Gates carried over from an earlier bake because this run got nothing. */
const stale = [];
let license = null;
let accessTime = null;

for (const gate of gates) {
  const built = await buildGate(gate);
  if (!built) {
    // The same rule as the empty-manifest guard above, one level down. A gate
    // that has baked before and comes back empty today is almost always PBDB
    // having a moment, not a world that stopped existing — Huincul did exactly
    // this once, and skipping it dropped a gate out of the app in silence
    // while its JSON sat on disk untouched. Keep what was measured, and say so.
    const kept = await readFile(join(OUT_DIR, `${gate.id}.json`), "utf8").catch(() => null);
    if (kept) {
      const row = JSON.parse(kept);
      manifest.push({
        id: row.id, band: row.band, sites: row.sites, occurrences: row.occurrences,
        medianAgeMa: row.medianAgeMa, cast: row.cast.length, castTotal: row.castTotal,
        lat: row.lat, lng: row.lng, paleoLat: row.paleoLat, paleoLng: row.paleoLng,
      });
      stale.push(gate.id);
      console.log(`  ${gate.id.padEnd(18)} no records this run — KEPT the last bake, not rewritten`);
      continue;
    }
    console.log(`  ${gate.id.padEnd(18)} no records in window — check the query or the age`);
    continue;
  }
  license ??= built.license;
  accessTime ??= built.accessTime;
  const { accessTime: _a, license: _l, ...row } = built;
  await writeFile(join(OUT_DIR, `${gate.id}.json`), JSON.stringify(row));
  manifest.push({
    id: row.id, band: row.band, sites: row.sites, occurrences: row.occurrences,
    medianAgeMa: row.medianAgeMa, cast: row.cast.length, castTotal: row.castTotal,
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
if (stale.length > 0) {
  console.log(`${stale.length} carried over from the last bake, not measured today: ${stale.join(", ")}`);
}

if (placeless.size > 0) {
  console.log(`${placeless.size} cast entries have no recorded habitat:`);
  for (const entry of placeless) console.log(`  ${entry}`);
}
