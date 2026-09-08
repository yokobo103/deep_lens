/**
 * Every creature named in a picture must be one the gate's own records name.
 *
 * AGENTS.md has said this since the first scene went in, and it has been kept
 * by hand — which caught a mammal drawn as a fish only because someone
 * remembered to look. This is the same rule as something that runs.
 *
 * It checks against the whole record, not the fourteen the bake keeps:
 * Solnhofen's Archaeopteryx has one occurrence and is in no top-fourteen, and
 * it is still in the record and still fine to draw.
 *
 *     npm run verify:scenes
 */

import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readGates } from "./gates-source.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://paleobiodb.org/data1.2";

const source = await readFile(join(ROOT, "src", "data", "drawn.ts"), "utf8");
const drawn = new Map();
for (const block of source.split(/\n  ["']?[\w-]+["']?: \[/).slice(1)) {
  // Recovered alongside the key it followed, in file order.
}
// Simpler and exact: pull each key with its list.
for (const match of source.matchAll(/["']?([\w-]+)["']?:\s*\[([^\]]*)\]/g)) {
  const names = [...match[2].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (names.length > 0) drawn.set(match[1], names);
}

const scenes = await readdir(join(ROOT, "src", "assets", "scenes")).catch(() => []);
const hasScene = new Set(scenes.map((file) => file.replace(/\.[^.]+$/, "")));

const gates = await readGates();
const failures = [];
const unpainted = [];
/** Gates PBDB gave nothing for today. Not a verdict on what is drawn in them. */
const unanswered = [];
let checked = 0;

for (const gate of gates) {
  const names = drawn.get(gate.id);
  // A gate with no picture yet has nothing to check. Only a gate that has a
  // scene and no recorded cast is a fault: that is a picture nobody verified.
  if (!names) {
    if (hasScene.has(gate.id)) failures.push(`${gate.id}: has a scene but no cast recorded in drawn.ts`);
    else unpainted.push(gate.id);
    continue;
  }
  const parameters = ["limit=10000", `max_ma=${gate.from}`, `min_ma=${gate.to}`];
  if (gate.stratum) parameters.push(`strat=${encodeURIComponent(gate.stratum)}`);
  if (gate.box) parameters.push(`lngmin=${gate.box.west}`, `lngmax=${gate.box.east}`, `latmin=${gate.box.south}`, `latmax=${gate.box.north}`);
  const response = await fetch(`${BASE}/occs/list.json?${parameters.join("&")}`);
  const body = await response.json();
  const recorded = new Set((body.records ?? []).filter((r) => r.rnk === 3 && r.tna).map((r) => r.tna));
  // An empty answer is not the same claim as a missing species. PBDB returned
  // nothing at all for Huincul one afternoon — a gate that had answered with 49
  // species that morning — and reporting that as five drawn animals "not in the
  // record" invites the next person to delete five correct entries to make the
  // check pass. A gate that answers with nothing is unanswered, and is said so.
  if (recorded.size === 0) {
    unanswered.push(gate.id);
    console.log(`  ${gate.id.padEnd(18)} PBDB returned no records — not checked this run`);
    continue;
  }
  for (const name of names) {
    checked += 1;
    if (!recorded.has(name)) failures.push(`${gate.id}: "${name}" is drawn but not in the record`);
  }
  console.log(`  ${gate.id.padEnd(18)} ${names.length} drawn, ${recorded.size} species recorded`);
}

console.log("");
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`${checked} drawn creatures, all present in their gate's records.`);
if (unanswered.length > 0) {
  console.log(`${unanswered.length} gates went unchecked because PBDB returned nothing: ${unanswered.join(", ")}`);
}
if (unpainted.length > 0) {
  console.log(`${unpainted.length} gates have no picture yet: ${unpainted.join(", ")}`);
}
