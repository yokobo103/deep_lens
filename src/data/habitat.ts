/**
 * Where a creature lived, folded into the few bands a picture can show.
 *
 * PBDB records two things per taxon that this reads: the environment its
 * describers placed it in (terrestrial, marine, freshwater, brackish…) and its
 * life habit (ground dwelling, volant, nektonic, epifaunal, infaunal…). Both
 * are the original authors' judgements, not ours — which is the point. A card
 * that says "large predator" is us inventing a caption for 75 animals we have
 * never met; a card that says "flew" is repeating what the record says, and can
 * be checked.
 *
 * Measured over the fifteen gates: 203 of 210 cast entries carry one or the
 * other. The seven that carry neither are almost all plants, which get their
 * own band anyway.
 */

export type Layer = "air" | "land" | "shore" | "swim" | "onFloor" | "inFloor" | "plant" | "trace" | "unknown";

/** Top to bottom, as a reader would stack them. */
export const LAYER_ORDER: readonly Layer[] = ["air", "plant", "land", "shore", "swim", "onFloor", "inFloor", "trace", "unknown"];

export const LAYER_LABEL: Record<Layer, { ja: string; en: string }> = {
  air: { ja: "空", en: "In the air" },
  plant: { ja: "植物", en: "Plants" },
  land: { ja: "陸", en: "On land" },
  shore: { ja: "水辺", en: "At the water's edge" },
  swim: { ja: "水中", en: "Swimming" },
  onFloor: { ja: "底の上", en: "On the bottom" },
  inFloor: { ja: "底の中", en: "In the bottom" },
  trace: { ja: "足跡・卵", en: "Tracks and eggs" },
  unknown: { ja: "記録なし", en: "Not recorded" },
};

const has = (value: string | null | undefined, ...words: string[]) =>
  !!value && words.some((word) => value.toLowerCase().includes(word));

/**
 * One creature's band, from PBDB's own fields.
 *
 * Order matters. Life habit is asked first because it is the more specific of
 * the two and because it is the field that survives in the sea: a marine gate
 * records "marine" for everybody, so environment alone would put a whole world
 * in one band. Western Interior has an environment for 1 of its 14 and a life
 * habit for all 14.
 */
export function layerOf(
  phylum: string | null,
  environment: string | null,
  habit: string | null,
  klass: string | null = null,
  /** PBDB's taxon flags, as a set of letters: I a footprint, F an egg or a
   * detached organ, and "IF" both at once. */
  form: string | null = null,
): Layer {
  if (has(phylum, "angiosperm", "gymnosperm", "plantae", "spermatophyt")) return "plant";
  // A footprint and an eggshell are records of an animal, not places it stood.
  // The flags are a set, not a value: PBDB writes "IF" for a footprint that is
  // also a form taxon, and three of Clarens' ten footprints carry it. Matching
  // the whole string put them on land, standing.
  if (form?.includes("I") || form?.includes("F")) return "trace";
  if (has(habit, "volant")) return "air";
  if (has(habit, "infaunal")) return "inFloor";
  if (has(habit, "epifaunal")) return "onFloor";
  if (has(habit, "nektonic", "nektobenthic", "aquatic")) return "swim";
  if (has(habit, "amphibious")) return "shore";
  if (has(habit, "arboreal", "scansorial", "ground dwelling")) {
    // A ground dweller recorded in water as well as on land stood at the edge.
    return has(environment, "freshwater", "brackish", "lagoonal", "marine", "coastal") ? "shore" : "land";
  }
  if (has(environment, "terrestrial")) {
    return has(environment, "freshwater", "brackish", "lagoonal", "marine", "coastal") ? "shore" : "land";
  }
  if (has(environment, "marine", "freshwater", "lagoonal", "brackish", "coastal", "shelf", "oceanic")) return "swim";
  // Last resort, and only where the class itself settles it: PBDB has no
  // ecospace for some fish, and a coelacanth was in the water whatever the
  // record forgot to say. Nothing else is guessed from class.
  if (has(klass, "osteichthyes", "chondrichthyes", "actinopterygii", "sarcopterygii")) return "swim";
  return "unknown";
}
