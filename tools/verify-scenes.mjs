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

import { readFile } from "node:fs/promises";
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

const gates = await readGates();
const failures = [];
let checked = 0;

for (const gate of gates) {
  const names = drawn.get(gate.id);
  if (!names) { failures.push(`${gate.id}: no scene cast recorded`); continue; }
  const parameters = ["limit=10000", `max_ma=${gate.from}`, `min_ma=${gate.to}`];
  if (gate.stratum) parameters.push(`strat=${encodeURIComponent(gate.stratum)}`);
  if (gate.box) parameters.push(`lngmin=${gate.box.west}`, `lngmax=${gate.box.east}`, `latmin=${gate.box.south}`, `latmax=${gate.box.north}`);
  const response = await fetch(`${BASE}/occs/list.json?${parameters.join("&")}`);
  const body = await response.json();
  const recorded = new Set((body.records ?? []).filter((r) => r.rnk === 3 && r.tna).map((r) => r.tna));
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
