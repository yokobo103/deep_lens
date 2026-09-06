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
 *   `query`    how to find its records. A stratigraphic unit name, a box of
 *              modern coordinates, or both. Both is what a hub often needs: the
 *              Chinle, Morrison and Green River each outcrop over most of the
 *              American West, and only where they are stacked in the same
 *              cliffs is it true to call them one place.
 *   `ageMa`    the window, always. Unit names are not unique: asking PBDB for
 *              "Kem Kem" also returns an 8 Ma record and "Hell Creek" a 103 Ma
 *              one, both from unrelated units that happen to share a name.
 *
 * Two fields carry the two ways out of a world, and they are perpendicular:
 *
 *   `band`  same age, other places. Gates in one band stand on the same
 *           reconstructed Earth and can be seen from each other, so the band —
 *           not the gate — is what a terrain texture belongs to.
 *   `hub`   same place, other ages. This is the move the whole app is for:
 *           the present place is one moment of a place that had many.
 *
 * Both are reachable from inside a world without returning to the present.
 */

export interface GateQuery {
  /** PBDB stratigraphic unit name. */
  stratum?: string;
  /** Modern bounding box, for gates with no usable unit name. */
  box?: { west: number; east: number; south: number; north: number };
}

export interface GateDefinition {
  id: string;
  /** The way in on the present Earth. Defaults to the gate's own id. */
  hub?: string;
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
  featured?: boolean;
}

/**
 * Where a gate stands on the present-day Earth. Gates that share a hub are the
 * same place seen at different ages, so the globe shows one way in and the
 * choice of age is made after arriving. Fezouata and Kem Kem are 150 km apart
 * in southern Morocco: two markers there sit on top of each other, and pushing
 * them apart would be drawing a difference that does not exist.
 */
export interface HubDefinition {
  id: string;
  name: { ja: string; en: string };
  place: { ja: string; en: string };
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
  { id: "late-jurassic", terrainMa: 150, label: { ja: "ジュラ紀後期 · 約150 Ma", en: "Late Jurassic · ~150 Ma" } },
  { id: "late-triassic", terrainMa: 220, label: { ja: "三畳紀後期 · 約220 Ma", en: "Late Triassic · ~220 Ma" } },
  { id: "early-eocene", terrainMa: 50, label: { ja: "始新世前期 · 約50 Ma", en: "Early Eocene · ~50 Ma" } },
];

export const hubDefinitions: readonly HubDefinition[] = [
  { id: "morocco", name: { ja: "モロッコ", en: "Morocco" }, place: { ja: "北アフリカ", en: "North Africa" } },
  { id: "colorado", name: { ja: "コロラド高原", en: "Colorado Plateau" }, place: { ja: "アメリカ合衆国", en: "United States" } },
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
    hub: "morocco",
    band: "mid-cretaceous",
    query: { stratum: "Kem Kem" },
    ageMa: { from: 100, to: 93 },
    place: { ja: "モロッコ", en: "Morocco" },
    name: { ja: "ケムケム", en: "Kem Kem" },
    world: { ja: "大河とデルタ、大型の捕食者たち", en: "A great river delta and its large predators" },
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
    hub: "morocco",
    band: "early-ordovician",
    query: { stratum: "Fezouata" },
    ageMa: { from: 485, to: 470 },
    place: { ja: "モロッコ", en: "Morocco" },
    name: { ja: "フェズアタ", en: "Fezouata" },
    world: { ja: "極に近い、冷たい海の底", en: "A cold sea floor, close to the pole" },
    featured: true,
  },

  {
    id: "chinle",
    hub: "colorado",
    band: "late-triassic",
    query: { stratum: "Chinle", box: { west: -113, east: -105, south: 36, north: 41 } },
    ageMa: { from: 235, to: 205 },
    place: { ja: "アメリカ合衆国", en: "United States" },
    name: { ja: "チンリ", en: "Chinle" },
    world: { ja: "恐竜がまだ主役でない、川と湖", en: "Rivers and lakes, before dinosaurs were the story" },
    featured: true,
  },
  {
    id: "morrison",
    hub: "colorado",
    band: "late-jurassic",
    query: { stratum: "Morrison", box: { west: -113, east: -105, south: 36, north: 41 } },
    ageMa: { from: 157, to: 145 },
    place: { ja: "アメリカ合衆国", en: "United States" },
    name: { ja: "モリソン", en: "Morrison" },
    world: { ja: "巨大な竜脚類が歩いた氾濫原", en: "Floodplains walked by the largest sauropods" },
    featured: true,
  },
  {
    id: "green-river",
    hub: "colorado",
    band: "early-eocene",
    query: { stratum: "Green River", box: { west: -113, east: -105, south: 36, north: 41 } },
    ageMa: { from: 54, to: 46 },
    place: { ja: "アメリカ合衆国", en: "United States" },
    name: { ja: "グリーンリバー", en: "Green River" },
    world: { ja: "亜熱帯の湖と、そこへ落ちた無数の虫", en: "A subtropical lake, and the insects that fell into it" },
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

export function hubIdOf(gate: GateDefinition): string {
  return gate.hub ?? gate.id;
}

export interface Hub {
  id: string;
  name: { ja: string; en: string };
  place: { ja: string; en: string };
  gates: GateDefinition[];
}

/**
 * The ways in, one per place. A hub with several gates is one marker offering
 * several ages; a hub with one is that gate.
 */
export function hubs(): Hub[] {
  const grouped = new Map<string, GateDefinition[]>();
  for (const gate of gateDefinitions) {
    const id = hubIdOf(gate);
    grouped.set(id, [...(grouped.get(id) ?? []), gate]);
  }
  return [...grouped.entries()].map(([id, gates]) => {
    const named = hubDefinitions.find((hub) => hub.id === id);
    return {
      id,
      name: named?.name ?? gates[0]!.name,
      place: named?.place ?? gates[0]!.place,
      // Oldest first: arriving at a place and being offered its deepest age
      // first is the direction this app reads in.
      gates: [...gates].sort((a, b) => b.ageMa.from - a.ageMa.from),
    };
  });
}
