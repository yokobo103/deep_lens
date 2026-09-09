/**
 * A configured scene is all-or-nothing: every printed species listed for that
 * gate has one normalized label coordinate, and nothing else has slipped in.
 *
 *     npm run verify:highlights
 */

import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const drawnSource = await readFile(join(ROOT, "src", "data", "drawn.ts"), "utf8");
const highlightSource = await readFile(join(ROOT, "src", "data", "sceneHighlights.ts"), "utf8");
const sceneFiles = await readdir(join(ROOT, "src", "assets", "scenes"));
const sceneIds = new Set(sceneFiles.map((file) => file.replace(/\.[^.]+$/, "")));

const drawn = new Map();
for (const match of drawnSource.matchAll(/^[ ]{2}"?([\w-]+)"?:\s*\[([\s\S]*?)^[ ]{2}\],?$/gm)) {
  drawn.set(match[1], [...match[2].matchAll(/"([^"]+)"/g)].map((name) => name[1]));
}

const configured = new Map();
const failures = [];
for (const gateMatch of highlightSource.matchAll(/^[ ]{2}"?([\w-]+)"?:\s*\{([\s\S]*?)^[ ]{2}\},?$/gm)) {
  const gateId = gateMatch[1];
  if (configured.has(gateId)) failures.push(`${gateId}: gate is configured more than once`);
  const rows = [];
  for (const row of gateMatch[2].matchAll(/^[ ]{4}"([^"]+)":\s*\{\s*x:\s*(-?\d+(?:\.\d+)?),\s*y:\s*(-?\d+(?:\.\d+)?)\s*\},?$/gm)) {
    rows.push({ name: row[1], x: Number(row[2]), y: Number(row[3]) });
  }
  configured.set(gateId, rows);
}

for (const [gateId, rows] of configured) {
  const expected = drawn.get(gateId);
  if (!expected) {
    failures.push(`${gateId}: no matching gate entry in drawn.ts`);
    continue;
  }
  if (!sceneIds.has(gateId)) failures.push(`${gateId}: no matching scene asset`);

  const seen = new Set();
  for (const { name, x, y } of rows) {
    if (seen.has(name)) failures.push(`${gateId}: duplicate coordinate for "${name}"`);
    seen.add(name);
    if (!(x > 0 && x < 1) || !(y > 0 && y < 1)) {
      failures.push(`${gateId}: "${name}" must use x/y strictly between 0 and 1 (got ${x}, ${y})`);
    }
    if (!expected.includes(name)) failures.push(`${gateId}: "${name}" is not listed in drawn.ts`);
  }

  for (const name of expected) {
    if (!seen.has(name)) failures.push(`${gateId}: missing coordinate for "${name}"`);
  }
  if (rows.length === expected.length && rows.some((row, index) => row.name !== expected[index])) {
    failures.push(`${gateId}: coordinate rows must follow drawn.ts order`);
  }
}

if (configured.size === 0) failures.push("No scene highlight coordinates were found");

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

const points = [...configured.values()].reduce((total, rows) => total + rows.length, 0);
const remaining = [...drawn.keys()].filter((gateId) => !configured.has(gateId));
console.log(`${configured.size} scene${configured.size === 1 ? "" : "s"}, ${points} label coordinates verified.`);
console.log(`${remaining.length} scenes remain unconfigured.`);
