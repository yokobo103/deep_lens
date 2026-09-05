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
 * What a whole region is drawn as on the present-day Earth: the same world it
 * was, in brown. Creatures are not mapped to anything here — a creature is
 * drawn as itself in both ages, and only the colour changes. Turning a
 * Spinosaurus into a generic bone threw away the one thing the time shift is
 * meant to show, which is that you are still looking at the same animal.
 */
const REGION_ICON: Record<string, string> = {
  "kem-kem": "world-delta",
  huincul: "world-river",
  winton: "world-river",
  greenhorn: "world-sea",
};

const FALLBACK_ANCIENT = "world-dryland";

export function ancientIcon(category: string): string {
  return ANCIENT_ICON[category] ?? FALLBACK_ANCIENT;
}

export function regionTraceIcon(regionId: string): string {
  return REGION_ICON[regionId] ?? FALLBACK_ANCIENT;
}
