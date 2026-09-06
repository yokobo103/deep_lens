/**
 * How the gates connect, and how far each one is standing from its own Earth.
 *
 * Deep Lens has two ways out of a world and they pull against each other:
 *
 *   across  the band — the same age in other places. Markers on the globe.
 *   down    the hub  — the same place at other ages. Buttons in the panel.
 *
 * Adding a hub with three ages opens three new bands, and unless something
 * else already stands in them, three worlds where turning the globe finds
 * nobody. That happened the day Colorado was added: lonely bands went from
 * one to four. It is not visible in gates.ts, only in the app, and only if
 * you go and look — so it is printed here instead of written down as a rule.
 *
 * The offset column is a different kind of honesty. A band draws one
 * reconstruction, and every gate in it stands on that Earth whatever its own
 * records say. A gate 8 Myr from its band's terrain is standing on a map of
 * somewhere it nearly was; 20 Myr and the claim is getting thin.
 *
 *     npm run gates:map
 */

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readGates, readBands } from "./gates-source.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BAKED = join(ROOT, "public", "data", "gates", "manifest.json");

/** Beyond this, a gate is standing on an Earth that is not really its own. */
const OFFSET_LIMIT_MA = 15;

const pad = (value, width) => String(value).padEnd(width);
const num = (value, width) => String(value).padStart(width);

const gates = await readGates();
const bands = await readBands();

let baked = new Map();
try {
  const manifest = JSON.parse(await readFile(BAKED, "utf8"));
  baked = new Map(manifest.gates.map((gate) => [gate.id, gate]));
} catch {
  console.log("(no bake found — run npm run data:gates for the offset column)\n");
}

const byBand = new Map();
const byHub = new Map();
for (const gate of gates) {
  byBand.set(gate.band, [...(byBand.get(gate.band) ?? []), gate]);
  byHub.set(gate.hub, [...(byHub.get(gate.hub) ?? []), gate]);
}

const age = (gate) => bands.get(gate.band)?.terrainMa ?? 0;
const offset = (gate) => {
  const median = baked.get(gate.id)?.medianAgeMa;
  return median === undefined ? null : Math.abs(median - age(gate));
};

console.log(`${pad("gate", 18)}${pad("band", 20)}${pad("across", 8)}${pad("hub", 18)}${pad("down", 6)}${pad("offset", 8)}verdict`);
console.log("-".repeat(96));

let connected = 0;
let stranded = 0;
const strained = [];
for (const gate of [...gates].sort((a, b) => age(b) - age(a))) {
  const across = byBand.get(gate.band).length - 1;
  const down = byHub.get(gate.hub).length - 1;
  const drift = offset(gate);
  if (across && down) connected += 1;
  if (!across && !down) stranded += 1;
  if (drift !== null && drift > OFFSET_LIMIT_MA) strained.push([gate, drift]);
  const verdict = across && down ? "both" : across ? "across only" : down ? "down only" : "STRANDED";
  console.log(
    pad(gate.id, 18) + pad(`${gate.band} (${age(gate)})`, 20) + num(across, 3) + "     " +
    pad(gate.hub, 18) + num(down, 3) + "   " + pad(drift === null ? "-" : drift.toFixed(1), 8) + verdict,
  );
}

console.log("-".repeat(96));
console.log(`${connected}/${gates.length} reach both ways.  ${stranded} stranded.\n`);

console.log("bands");
const lonely = [];
for (const [id, members] of [...byBand.entries()].sort((a, b) => (bands.get(b[0])?.terrainMa ?? 0) - (bands.get(a[0])?.terrainMa ?? 0))) {
  const band = bands.get(id);
  if (members.length === 1) lonely.push(id);
  console.log(`  ${num(band?.terrainMa ?? "?", 4)} Ma  ${pad(id, 20)}${num(members.length, 2)}  ${members.map((g) => g.id).join(", ")}${members.length === 1 ? "   <- alone" : ""}`);
}

if (lonely.length) {
  console.log(`\n${lonely.length} band(s) with a single gate: ${lonely.join(", ")}`);
  console.log("A gate alone in its band has an Earth to stand on and nobody to find on it.");
}
for (const [gate, drift] of strained) {
  console.log(`\n${gate.id} sits ${drift.toFixed(1)} Myr from its band's terrain (limit ${OFFSET_LIMIT_MA}). Give it a band of its own, or move it.`);
}
