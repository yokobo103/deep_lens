/**
 * The gates: the places where a past world can be entered.
 *
 * A gate is one world at one age. This file is the whole definition of what
 * exists in Deep Lens; adding a world means adding an entry here and running
 * `npm run data:gates`. Nothing else has to change — the bake reads this file,
 * and the globe draws whatever the bake produced.
 *
 * Two things a gate must carry beyond its name:
 *
 *   `query`    how to find its records. A stratigraphic unit name where one
 *              exists, or a box of modern coordinates where it does not —
 *              Chengjiang and La Brea have no usable unit name in PBDB.
 *   `ageMa`    the window, always. Unit names are not unique: asking PBDB for
 *              "Kem Kem" also returns an 8 Ma record and "Hell Creek" a 103 Ma
 *              one, both from unrelated units that happen to share a name.
 *
 * `band` groups gates that share a world. Gates in one band stand on the same
 * reconstructed Earth and can be seen from each other, so the band — not the
 * gate — is what a terrain texture belongs to.
 */

export interface GateQuery {
  /** PBDB stratigraphic unit name. */
  stratum?: string;
  /** Modern bounding box, for gates with no usable unit name. */
  box?: { west: number; east: number; south: number; north: number };
}

export interface GateDefinition {
  id: string;
  /** The band this gate stands in. Gates in one band share a terrain. */
  band: string;
  query: GateQuery;
  /** Only records inside this window count as this gate. */
  ageMa: { from: number; to: number };
  /** Modern country or region, for the label. */
  place: { ja: string; en: string };
  name: { ja: string; en: string };
  /** One line. What kind of world this is — not a summary of its fauna. */
  world: { ja: string; en: string };
  /** Gates reachable from this one without returning to the present. */
  alsoAtThisPlace?: string[];
  featured?: boolean;
}

export interface BandDefinition {
  id: string;
  /** The reconstruction this band's Earth is drawn from. */
  terrainMa: number;
  label: { ja: string; en: string };
}

/**
 * One terrain per band, not per gate. Seven gates need three Earths.
 * Terrain files are rendered by `tools/render-paleodem-texture.py` from the
 * Scotese & Wright PaleoDEM archive, which covers 0–540 Ma at 5 Myr steps —
 * so any band a future gate needs already has a map waiting.
 */
export const bandDefinitions: readonly BandDefinition[] = [
  { id: "late-cretaceous", terrainMa: 70, label: { ja: "白亜紀後期 · 約70 Ma", en: "Late Cretaceous · ~70 Ma" } },
  { id: "mid-cretaceous", terrainMa: 95, label: { ja: "白亜紀中期 · 約95 Ma", en: "Mid Cretaceous · ~95 Ma" } },
  { id: "early-ordovician", terrainMa: 475, label: { ja: "オルドビス紀前期 · 約475 Ma", en: "Early Ordovician · ~475 Ma" } },
];

export const gateDefinitions: readonly GateDefinition[] = [
  {
    id: "hell-creek",
    band: "late-cretaceous",
    query: { stratum: "Hell Creek" },
    ageMa: { from: 72, to: 66 },
    place: { ja: "アメリカ合衆国", en: "United States" },
    name: { ja: "ヘルクリーク", en: "Hell Creek" },
    world: { ja: "白亜紀最後の川と氾濫原", en: "The last rivers and floodplains of the Cretaceous" },
    alsoAtThisPlace: ["dinosaur-park"],
    featured: true,
  },
  {
    id: "dinosaur-park",
    band: "late-cretaceous",
    query: { stratum: "Dinosaur Park" },
    ageMa: { from: 80, to: 74 },
    place: { ja: "カナダ", en: "Canada" },
    name: { ja: "ダイナソーパーク", en: "Dinosaur Park" },
    world: { ja: "海に近い、角竜の多い低地", en: "Coastal lowlands thick with horned dinosaurs" },
    alsoAtThisPlace: ["hell-creek"],
    featured: true,
  },
  {
    id: "nemegt",
    band: "late-cretaceous",
    query: { stratum: "Nemegt" },
    ageMa: { from: 72, to: 66 },
    place: { ja: "モンゴル", en: "Mongolia" },
    name: { ja: "ネメグト", en: "Nemegt" },
    world: { ja: "内陸の河川と湿地", en: "Inland rivers and wetlands" },
    featured: true,
  },
  {
    id: "maevarano",
    band: "late-cretaceous",
    query: { stratum: "Maevarano" },
    ageMa: { from: 72, to: 66 },
    place: { ja: "マダガスカル", en: "Madagascar" },
    name: { ja: "マエヴァラノ", en: "Maevarano" },
    world: { ja: "切り離された島の、独特な顔ぶれ", en: "An island cut adrift, with a cast of its own" },
    featured: true,
  },
  {
    id: "kem-kem",
    band: "mid-cretaceous",
    query: { stratum: "Kem Kem" },
    ageMa: { from: 100, to: 93 },
    place: { ja: "モロッコ", en: "Morocco" },
    name: { ja: "ケムケム", en: "Kem Kem" },
    world: { ja: "大河とデルタ、大型の捕食者たち", en: "A great river delta and its large predators" },
    alsoAtThisPlace: ["fezouata"],
    featured: true,
  },
  {
    id: "western-interior",
    band: "mid-cretaceous",
    query: { stratum: "Greenhorn" },
    ageMa: { from: 100, to: 92 },
    place: { ja: "アメリカ合衆国", en: "United States" },
    name: { ja: "西部内陸海路", en: "Western Interior Seaway" },
    world: { ja: "大陸を割った海", en: "A sea that split a continent" },
    featured: true,
  },
  {
    id: "fezouata",
    band: "early-ordovician",
    query: { stratum: "Fezouata" },
    ageMa: { from: 485, to: 470 },
    place: { ja: "モロッコ", en: "Morocco" },
    name: { ja: "フェズアタ", en: "Fezouata" },
    world: { ja: "極に近い、冷たい海の底", en: "A cold sea floor, close to the pole" },
    alsoAtThisPlace: ["kem-kem"],
    featured: true,
  },
];

export function gateById(id: string): GateDefinition | undefined {
  return gateDefinitions.find((gate) => gate.id === id);
}

export function bandById(id: string): BandDefinition | undefined {
  return bandDefinitions.find((band) => band.id === id);
}

/** The other gates standing on the same Earth as this one. */
export function gatesInBand(bandId: string, exceptId?: string): GateDefinition[] {
  return gateDefinitions.filter((gate) => gate.band === bandId && gate.id !== exceptId);
}
