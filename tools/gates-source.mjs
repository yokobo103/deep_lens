/**
 * The one reader of src/data/gates.ts.
 *
 * Two tools need the gate list — the bake that fetches records for it, and the
 * map that checks how the gates connect — and a second copy of this parser
 * would be a second thing to forget. It reads the TypeScript rather than a
 * duplicated JSON so that gates.ts stays the only place a gate is declared.
 */

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const GATES_SOURCE = join(ROOT, "src", "data", "gates.ts");

/** Checked out on Windows this file has CRLF endings, and the block split
 *  below looks for a bare newline — without normalising, the parser quietly
 *  finds nothing at all. */
async function source() {
  return (await readFile(GATES_SOURCE, "utf8")).replace(/\r\n/g, "\n");
}

/**
 * Read the definitions out of the TypeScript rather than duplicating them.
 * A second copy of this list is a second thing to forget to update.
 */
export async function readGates() {
  const text = await source();
  const body = text.slice(text.indexOf("export const gateDefinitions"));
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
      // A gate with no hub of its own is its own hub, as in the app.
      hub: block.match(/hub:\s*"([^"]+)"/)?.[1] ?? id,
      name: block.match(/name:\s*\{\s*ja:\s*"([^"]+)"/)?.[1] ?? id,
      stratum,
      box: box ? { west: +box[1], east: +box[2], south: +box[3], north: +box[4] } : undefined,
      from: age ? +age[1] : null,
      to: age ? +age[2] : null,
    });
  }
  return gates;
}

/** The bands, so a tool can say which Earth a gate is standing on. */
export async function readBands() {
  const text = await source();
  const block = text.slice(text.indexOf("export const bandDefinitions"), text.indexOf("export const hubDefinitions"));
  const bands = new Map();
  for (const line of block.split("\n")) {
    const id = line.match(/id:\s*"([^"]+)"/)?.[1];
    const terrainMa = line.match(/terrainMa:\s*([\d.]+)/)?.[1];
    const label = line.match(/label:\s*\{\s*ja:\s*"([^"]+)"/)?.[1];
    if (id && terrainMa) bands.set(id, { terrainMa: +terrainMa, label: label ?? id });
  }
  return bands;
}
