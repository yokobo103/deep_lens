/**
 * The single place that decides which picture a thing is drawn with.
 *
 * Artwork is picked up from `src/assets/icons` by file name, so replacing the
 * whole set means dropping new files in with the same names — no code changes.
 * Changing which picture a category uses means editing one line below. The data
 * files never name a file, only a category, so the two can move independently.
 */

/**
 * Two faces of the same drawing, built by `tools/build-icons.py`. Colour is the
 * living Earth; brown is what is left of it. The split is the loudest thing the
 * app says without words, so it lives in the artwork rather than in a filter.
 */
export type IconTone = "living" | "trace";

function collect(files: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(files).map(([path, url]) => [path.replace(/^.*\//, "").replace(/\.[^.]+$/, ""), url]),
  );
}

const living = collect(import.meta.glob("../assets/icons/color/*.{png,svg,webp}", {
  eager: true, query: "?url", import: "default",
}) as Record<string, string>);

const trace = collect(import.meta.glob("../assets/icons/trace/*.{png,svg,webp}", {
  eager: true, query: "?url", import: "default",
}) as Record<string, string>);

/** Available artwork, by file name. Useful for checking what a set contains. */
export const iconIds: readonly string[] = Object.keys(living).sort();

export function iconSource(iconId: string, tone: IconTone = "living"): string | undefined {
  return (tone === "trace" ? trace : living)[iconId];
}

/**
 * Category to artwork, for the living Earth. Categories come from the data and
 * describe what a marker *is*; the value is only what it currently looks like.
 */
const ANCIENT_ICON: Record<string, string> = {
  // Regional worlds
  delta: "world-delta",
  floodplain: "world-river",
  forest: "world-river",
  sea: "world-sea",
  water: "world-river",
  cluster: "world-dryland",
  // Animals
  theropod: "life-theropod",
  spinosaurus: "life-spinosaur",
  sauropod: "life-sauropod",
  herbivore: "life-ornithopod",
  crocodilian: "life-crocodilian",
  pterosaur: "life-pterosaur",
  shark: "life-shark",
  ray: "life-ray",
  fish: "life-fish",
  shell: "life-ammonite",
  bivalve: "life-bivalve",
  // Plants
  plant: "life-conifer",
  fern: "life-fern",
};

/**
 * Category to the form it survives as. This is the pairing the time shift
 * animates, so it must stay a function of the creature — a shark leaves teeth,
 * an ammonite leaves its shell — and never a second, unrelated taxonomy.
 */
const TRACE_ICON: Record<string, string> = {
  theropod: "trace-bone",
  spinosaurus: "trace-bone",
  sauropod: "trace-bone",
  herbivore: "trace-bone",
  crocodilian: "trace-bone",
  pterosaur: "trace-bone",
  fish: "trace-bone",
  // The sheet came back without a tooth, so sharks and rays borrow the bone for
  // now. A shark's record really is teeth, and Greenhorn is 235 of them, so this
  // is the first gap to close when the set is redrawn.
  shark: "trace-bone",
  ray: "trace-bone",
  shell: "trace-coiled-shell",
  bivalve: "trace-bivalve-shell",
  plant: "trace-frond",
  fern: "trace-frond",
};

/**
 * What a whole region is usually found as today, when no single creature is
 * selected. Chosen by the largest recorded class in the local PBDB extract:
 * Greenhorn is 235 sharks against 18 reptiles, so a bone would be wrong there.
 */
const REGION_TRACE_ICON: Record<string, string> = {
  "kem-kem": "trace-bone",
  huincul: "trace-bone",
  winton: "trace-bone",
  // Sharks lead the record here, but with no tooth in the set the ammonite
  // shell is the next honest thing: 114 records against 18 reptiles.
  greenhorn: "trace-coiled-shell",
};

const FALLBACK_ANCIENT = "world-dryland";
const FALLBACK_TRACE = "trace-bone";

export function ancientIcon(category: string): string {
  return ANCIENT_ICON[category] ?? FALLBACK_ANCIENT;
}

export function traceIcon(category: string): string {
  return TRACE_ICON[category] ?? FALLBACK_TRACE;
}

export function regionTraceIcon(regionId: string): string {
  return REGION_TRACE_ICON[regionId] ?? FALLBACK_TRACE;
}
