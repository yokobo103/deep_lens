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
 *
 * A band is deliberately wider than one moment. Its terrain is a single
 * reconstruction, and a gate whose records centre a few million years either
 * side still belongs on it — Dinosaur Park is 7.9 Myr from the 70 Ma map and
 * has always stood there. Splitting bands finely enough that every gate sat on
 * its exact age would give each one an Earth with nobody else on it, which
 * costs more truth than it buys. `npm run gates:map` prints both the loneliness
 * and the offsets, so the trade is visible rather than remembered.
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
  { id: "early-cretaceous", terrainMa: 130, label: { ja: "白亜紀前期 · 約130 Ma", en: "Early Cretaceous · ~130 Ma" } },
  { id: "early-triassic", terrainMa: 250, label: { ja: "三畳紀前期 · 約250 Ma", en: "Early Triassic · ~250 Ma" } },
  { id: "late-permian", terrainMa: 255, label: { ja: "ペルム紀後期 · 約255 Ma", en: "Late Permian · ~255 Ma" } },
  { id: "carboniferous", terrainMa: 315, label: { ja: "石炭紀 · 約315 Ma", en: "Carboniferous · ~315 Ma" } },
  { id: "devonian", terrainMa: 380, label: { ja: "デボン紀後期 · 約380 Ma", en: "Late Devonian · ~380 Ma" } },
  { id: "cambrian", terrainMa: 510, label: { ja: "カンブリア紀 · 約510 Ma", en: "Cambrian · ~510 Ma" } },
];

export const hubDefinitions: readonly HubDefinition[] = [
  { id: "morocco", name: { ja: "モロッコ", en: "Morocco" }, place: { ja: "北アフリカ", en: "North Africa" } },
  { id: "colorado", name: { ja: "コロラド高原", en: "Colorado Plateau" }, place: { ja: "アメリカ合衆国", en: "United States" } },
  { id: "karoo", name: { ja: "カルー", en: "The Karoo" }, place: { ja: "南アフリカ", en: "South Africa" } },
  { id: "seymour", name: { ja: "シーモア島", en: "Seymour Island" }, place: { ja: "南極半島", en: "Antarctic Peninsula" } },
  { id: "china", name: { ja: "中国", en: "China" }, place: { ja: "東アジア", en: "East Asia" } },
  { id: "england", name: { ja: "イングランド", en: "England" }, place: { ja: "イギリス", en: "United Kingdom" } },
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

  {
    id: "sarka",
    band: "early-ordovician",
    query: { stratum: "Sarka" },
    ageMa: { from: 478, to: 462 },
    place: { ja: "チェコ", en: "Czech Republic" },
    name: { ja: "シャルカ", en: "Sarka" },
    world: { ja: "泥の海底に降り積もった、殻の群れ", en: "Shells settling onto a muddy sea floor" },
    featured: true,
  },
  {
    id: "elliot",
    hub: "karoo",
    band: "late-triassic",
    query: { stratum: "Elliot" },
    ageMa: { from: 228, to: 205 },
    place: { ja: "南アフリカ", en: "South Africa" },
    name: { ja: "エリオット", en: "Elliot" },
    world: { ja: "大型化が始まったころの、乾いた氾濫原", en: "Dry floodplains, as the long-necked began to get large" },
    featured: true,
  },
  {
    id: "tendaguru",
    band: "late-jurassic",
    query: { stratum: "Tendaguru" },
    ageMa: { from: 157, to: 143 },
    place: { ja: "タンザニア", en: "Tanzania" },
    name: { ja: "テンダグル", en: "Tendaguru" },
    world: { ja: "季節ごとに乾く海岸平野と、巨大な竜脚類", en: "A coastal plain that dried each season, and its giant sauropods" },
    featured: true,
  },
  {
    id: "solnhofen",
    band: "late-jurassic",
    query: { stratum: "Solnhofen" },
    ageMa: { from: 155, to: 145 },
    place: { ja: "ドイツ", en: "Germany" },
    name: { ja: "ゾルンホーフェン", en: "Solnhofen" },
    world: { ja: "島々のあいだの、静かで塩辛い潟", en: "Still, salt-heavy lagoons between islands" },
    featured: true,
  },
  {
    id: "london-clay",
    hub: "england",
    band: "early-eocene",
    query: { stratum: "London Clay" },
    ageMa: { from: 56, to: 47 },
    place: { ja: "イギリス", en: "United Kingdom" },
    name: { ja: "ロンドンクレイ", en: "London Clay" },
    world: { ja: "マングローブの茂る、熱帯の入り江", en: "A tropical inlet thick with mangroves" },
    featured: true,
  },

  {
    id: "chengjiang",
    hub: "china",
    band: "cambrian",
    query: { box: { west: 102.3, east: 103.2, south: 24.3, north: 25.2 } },
    ageMa: { from: 525, to: 512 },
    place: { ja: "中国", en: "China" },
    name: { ja: "澄江", en: "Chengjiang" },
    world: { ja: "体のつくりが出そろった、浅い海", en: "A shallow sea where body plans arrived all at once" },
    featured: true,
  },
  {
    id: "burgess-shale",
    band: "cambrian",
    query: { stratum: "Burgess Shale" },
    ageMa: { from: 512, to: 502 },
    place: { ja: "カナダ", en: "Canada" },
    name: { ja: "バージェス頁岩", en: "Burgess Shale" },
    world: { ja: "泥崩れに飲まれて残った、奇妙な体の群れ", en: "Strange bodies, buried whole by a slide of mud" },
    featured: true,
  },
  {
    id: "anti-atlas",
    hub: "morocco",
    band: "devonian",
    query: { box: { west: -8, east: -3, south: 29, north: 32 } },
    ageMa: { from: 400, to: 372 },
    place: { ja: "モロッコ", en: "Morocco" },
    name: { ja: "アンチアトラス", en: "Anti-Atlas" },
    world: { ja: "三葉虫の最後の栄え", en: "The last flourishing of the trilobites" },
    featured: true,
  },
  {
    id: "gogo",
    band: "devonian",
    query: { stratum: "Gogo" },
    ageMa: { from: 387, to: 375 },
    place: { ja: "オーストラリア", en: "Australia" },
    name: { ja: "ゴーゴー", en: "Gogo" },
    world: { ja: "熱帯の礁と、甲冑をまとった魚たち", en: "A tropical reef, and fish in armour" },
    featured: true,
  },
  {
    id: "mazon-creek",
    band: "carboniferous",
    query: { stratum: "Francis Creek" },
    ageMa: { from: 315, to: 303 },
    place: { ja: "アメリカ合衆国", en: "United States" },
    name: { ja: "メイゾンクリーク", en: "Mazon Creek" },
    world: { ja: "石炭になる前の、シダの湿地", en: "The fern swamp that would become coal" },
    featured: true,
  },
  {
    id: "bear-gulch",
    band: "carboniferous",
    query: { stratum: "Bear Gulch" },
    ageMa: { from: 330, to: 318 },
    place: { ja: "アメリカ合衆国", en: "United States" },
    name: { ja: "ベアガルチ", en: "Bear Gulch" },
    world: { ja: "静かな入り江に沈んだ、魚だらけの海", en: "A still bay, and the sea of fish that sank into it" },
    featured: true,
  },
  {
    id: "beaufort",
    hub: "karoo",
    band: "late-permian",
    query: { stratum: "Beaufort" },
    ageMa: { from: 266, to: 252 },
    place: { ja: "南アフリカ", en: "South Africa" },
    name: { ja: "ボーフォート", en: "Beaufort" },
    world: { ja: "大量絶滅の直前、獣に似た顔が歩く大地", en: "The land of beast-faced reptiles, just before the dying" },
    featured: true,
  },
  {
    id: "zechstein",
    band: "late-permian",
    query: { stratum: "Zechstein" },
    ageMa: { from: 260, to: 252 },
    place: { ja: "ヨーロッパ", en: "Europe" },
    name: { ja: "ツェヒシュタイン", en: "Zechstein" },
    world: { ja: "塩が濃くなっていく、閉じた海", en: "A closed sea, going slowly to salt" },
    featured: true,
  },
  {
    id: "katberg",
    hub: "karoo",
    band: "early-triassic",
    query: { stratum: "Katberg" },
    ageMa: { from: 252, to: 245 },
    place: { ja: "南アフリカ", en: "South Africa" },
    name: { ja: "カットバーグ", en: "Katberg" },
    world: { ja: "絶滅の直後、生き残りだけが歩く荒れ地", en: "The bare ground after the dying, and the few that walked it" },
    featured: true,
  },
  {
    id: "moenkopi",
    hub: "colorado",
    band: "early-triassic",
    query: { stratum: "Moenkopi" },
    ageMa: { from: 250, to: 242 },
    place: { ja: "アメリカ合衆国", en: "United States" },
    name: { ja: "モエンコピ", en: "Moenkopi" },
    world: { ja: "浅い海が引いたあとの、泥の平原", en: "Mud flats left behind by a shallow sea" },
    featured: true,
  },
  {
    id: "yixian",
    hub: "china",
    band: "early-cretaceous",
    query: { stratum: "Yixian" },
    ageMa: { from: 130, to: 120 },
    place: { ja: "中国", en: "China" },
    name: { ja: "熱河", en: "Jehol" },
    world: { ja: "火山灰が降りつづけた湖と、羽毛のある恐竜", en: "A lake under falling ash, and dinosaurs with feathers" },
    featured: true,
  },
  {
    id: "wealden",
    hub: "england",
    band: "early-cretaceous",
    query: { stratum: "Wealden" },
    ageMa: { from: 140, to: 125 },
    place: { ja: "イギリス", en: "United Kingdom" },
    name: { ja: "ウィールド", en: "Wealden" },
    world: { ja: "イグアノドンが歩いた、大きな川の氾濫原", en: "The floodplain of a great river, walked by Iguanodon" },
    featured: true,
  },
  {
    id: "lopez-de-bertodano",
    hub: "seymour",
    band: "late-cretaceous",
    query: { stratum: "Lopez de Bertodano" },
    ageMa: { from: 70, to: 66 },
    place: { ja: "南極", en: "Antarctica" },
    name: { ja: "ロペス・デ・ベルトダーノ", en: "Lopez de Bertodano" },
    world: { ja: "氷のない南極の、冷たく浅い海", en: "A cold shallow sea off an Antarctica with no ice" },
    featured: true,
  },
  {
    id: "la-meseta",
    hub: "seymour",
    band: "early-eocene",
    query: { stratum: "La Meseta" },
    ageMa: { from: 54, to: 44 },
    place: { ja: "南極", en: "Antarctica" },
    name: { ja: "ラ・メセタ", en: "La Meseta" },
    world: { ja: "南極に森があったころの、岸辺", en: "A shoreline, back when Antarctica had forests" },
    featured: true,
  },
  {
    id: "ischigualasto",
    band: "late-triassic",
    query: { stratum: "Ischigualasto" },
    ageMa: { from: 236, to: 224 },
    place: { ja: "アルゼンチン", en: "Argentina" },
    name: { ja: "イシグアラスト", en: "Ischigualasto" },
    world: { ja: "最初の恐竜が現れた、季節のある平原", en: "A plain of wet and dry seasons, where the first dinosaurs appear" },
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
