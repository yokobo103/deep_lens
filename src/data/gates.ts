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
  /** Broad present-day geography. Never a palaeocontinent. */
  currentRegion: CurrentRegionId;
  name: { ja: string; en: string };
  /** One line. What kind of world this is — not a summary of its fauna. */
  world: { ja: string; en: string };
  featured?: boolean;
}

export type CurrentRegionId =
  | "north-america"
  | "south-america"
  | "europe"
  | "africa"
  | "asia"
  | "oceania"
  | "antarctica";

export interface CurrentRegionDefinition {
  id: CurrentRegionId;
  name: { ja: string; en: string };
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
  /**
   * Which rendered file to load, when it is not simply `paleodem-<terrainMa>`.
   *
   * Scotese steps 5 Myr and stops at 0, so a band a hundred thousand years old
   * has no map of its own. The Pleistocene borrows the 0 Ma elevation field and
   * draws it at glacial sea level instead — same data, one different contour —
   * and says so in `terrainNote`, because a picture that lowers the sea without
   * saying it claims a coastline the source never drew.
   */
  terrainKey?: string;
  terrainNote?: { ja: string; en: string };
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
  { id: "early-jurassic", terrainMa: 190, label: { ja: "ジュラ紀前期 · 約190 Ma", en: "Early Jurassic · ~190 Ma" } },
  { id: "paleocene", terrainMa: 60, label: { ja: "暁新世 · 約60 Ma", en: "Paleocene · ~60 Ma" } },
  {
    id: "pleistocene",
    terrainMa: 0.1,
    terrainKey: "0-glacial",
    terrainNote: {
      ja: "氷期の海面（現在より約120 m低い）",
      en: "glacial sea level, about 120 m below today",
    },
    label: { ja: "更新世 · 約10万年前", en: "Pleistocene · ~100,000 years ago" },
  },
  { id: "late-silurian", terrainMa: 425, label: { ja: "シルル紀後期 · 約425 Ma", en: "Late Silurian · ~425 Ma" } },
  { id: "middle-jurassic", terrainMa: 165, label: { ja: "ジュラ紀中期 · 約165 Ma", en: "Middle Jurassic · ~165 Ma" } },
  { id: "early-oligocene", terrainMa: 30, label: { ja: "漸新世 · 約30 Ma", en: "Oligocene · ~30 Ma" } },
  { id: "middle-miocene", terrainMa: 15, label: { ja: "中新世中期 · 約15 Ma", en: "Middle Miocene · ~15 Ma" } },
];

/**
 * The album groups journeys by today's geography so different ages can be
 * noticed at one familiar place. Keep this deliberately broader than country.
 */
export const currentRegionDefinitions: readonly CurrentRegionDefinition[] = [
  { id: "north-america", name: { ja: "北アメリカ", en: "North America" } },
  { id: "south-america", name: { ja: "南アメリカ", en: "South America" } },
  { id: "europe", name: { ja: "ヨーロッパ", en: "Europe" } },
  { id: "africa", name: { ja: "アフリカ", en: "Africa" } },
  { id: "asia", name: { ja: "アジア", en: "Asia" } },
  { id: "oceania", name: { ja: "オセアニア", en: "Oceania" } },
  { id: "antarctica", name: { ja: "南極", en: "Antarctica" } },
];

export const hubDefinitions: readonly HubDefinition[] = [
  { id: "morocco", name: { ja: "モロッコ", en: "Morocco" }, place: { ja: "北アフリカ", en: "North Africa" } },
  { id: "colorado", name: { ja: "コロラド高原", en: "Colorado Plateau" }, place: { ja: "アメリカ合衆国", en: "United States" } },
  { id: "karoo", name: { ja: "カルー", en: "The Karoo" }, place: { ja: "南アフリカ", en: "South Africa" } },
  { id: "seymour", name: { ja: "シーモア島", en: "Seymour Island" }, place: { ja: "南極半島", en: "Antarctic Peninsula" } },
  /* Split from a single "China" hub once the distances were taken. Chengjiang
     and Luoping are 162 km apart in Yunnan; Jehol is 2,437 km away in Liaoning,
     which is Tokyo to Hong Kong and not one region by any reading. */
  { id: "yunnan", name: { ja: "雲南", en: "Yunnan" }, place: { ja: "中国南部", en: "Southern China" } },
  { id: "liaoning", name: { ja: "遼寧", en: "Liaoning" }, place: { ja: "中国北東部", en: "Northeast China" } },
  { id: "colombia", name: { ja: "コロンビア", en: "Colombia" }, place: { ja: "南アメリカ北部", en: "Northern South America" } },
  { id: "england", name: { ja: "イングランド", en: "England" }, place: { ja: "イギリス", en: "United Kingdom" } },
];

export const gateDefinitions: readonly GateDefinition[] = [
  {
    id: "hell-creek",
    band: "late-cretaceous",
    query: { stratum: "Hell Creek" },
    ageMa: { from: 72, to: 66 },
    place: { ja: "アメリカ合衆国", en: "United States" },
    currentRegion: "north-america",
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
    currentRegion: "north-america",
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
    currentRegion: "asia",
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
    currentRegion: "africa",
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
    currentRegion: "africa",
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
    currentRegion: "north-america",
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
    currentRegion: "africa",
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
    currentRegion: "north-america",
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
    currentRegion: "north-america",
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
    currentRegion: "north-america",
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
    currentRegion: "europe",
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
    currentRegion: "africa",
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
    currentRegion: "africa",
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
    currentRegion: "europe",
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
    currentRegion: "europe",
    name: { ja: "ロンドンクレイ", en: "London Clay" },
    world: { ja: "マングローブの茂る、熱帯の入り江", en: "A tropical inlet thick with mangroves" },
    featured: true,
  },

  {
    id: "chengjiang",
    hub: "yunnan",
    band: "cambrian",
    query: { box: { west: 102.3, east: 103.2, south: 24.3, north: 25.2 } },
    ageMa: { from: 525, to: 512 },
    place: { ja: "中国", en: "China" },
    currentRegion: "asia",
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
    currentRegion: "north-america",
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
    currentRegion: "africa",
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
    currentRegion: "oceania",
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
    currentRegion: "north-america",
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
    currentRegion: "north-america",
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
    currentRegion: "africa",
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
    currentRegion: "europe",
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
    currentRegion: "africa",
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
    currentRegion: "north-america",
    name: { ja: "モエンコピ", en: "Moenkopi" },
    world: { ja: "浅い海が引いたあとの、泥の平原", en: "Mud flats left behind by a shallow sea" },
    featured: true,
  },
  {
    id: "yixian",
    hub: "liaoning",
    band: "early-cretaceous",
    query: { stratum: "Yixian" },
    ageMa: { from: 130, to: 120 },
    place: { ja: "中国", en: "China" },
    currentRegion: "asia",
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
    currentRegion: "europe",
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
    currentRegion: "antarctica",
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
    currentRegion: "antarctica",
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
    currentRegion: "south-america",
    name: { ja: "イシグアラスト", en: "Ischigualasto" },
    world: { ja: "最初の恐竜が現れた、季節のある平原", en: "A plain of wet and dry seasons, where the first dinosaurs appear" },
    featured: true,
  },

  {
    id: "huincul",
    band: "mid-cretaceous",
    query: { stratum: "Huincul" },
    ageMa: { from: 100, to: 90 },
    currentRegion: "south-america",
    place: { ja: "アルゼンチン", en: "Argentina" },
    name: { ja: "ウインクル", en: "Huincul" },
    world: { ja: "巨大な竜脚類と、それを追う大型獣脚類の平原", en: "A plain of giant sauropods, and the hunters that followed them" },
    featured: true,
  },
  {
    id: "winton",
    band: "mid-cretaceous",
    query: { stratum: "Winton" },
    ageMa: { from: 100, to: 90 },
    currentRegion: "oceania",
    place: { ja: "オーストラリア", en: "Australia" },
    name: { ja: "ウィントン", en: "Winton" },
    world: { ja: "南の大陸を流れた、曲がりくねった川", en: "Winding rivers across a southern continent" },
    featured: true,
  },
  {
    id: "djadokhta",
    band: "late-cretaceous",
    query: { stratum: "Djadokhta" },
    ageMa: { from: 78, to: 70 },
    currentRegion: "asia",
    place: { ja: "モンゴル", en: "Mongolia" },
    name: { ja: "ジャドフタ", en: "Djadokhta" },
    world: { ja: "砂丘と乾いた風。同じ時代のネメグトとは正反対", en: "Dunes and a dry wind — the opposite of Nemegt, at the same age" },
    featured: true,
  },
  {
    id: "luoping",
    hub: "yunnan",
    band: "early-triassic",
    query: { box: { west: 103.9, east: 104.6, south: 24.5, north: 25.2 } },
    ageMa: { from: 248, to: 240 },
    currentRegion: "asia",
    place: { ja: "中国", en: "China" },
    name: { ja: "羅平", en: "Luoping" },
    world: { ja: "絶滅から立ち直りつつある、暖かい浅い海", en: "A warm shallow sea, climbing back out of the extinction" },
    featured: true,
  },
  {
    id: "crato",
    band: "early-cretaceous",
    query: { stratum: "Crato" },
    ageMa: { from: 120, to: 110 },
    currentRegion: "south-america",
    place: { ja: "ブラジル", en: "Brazil" },
    name: { ja: "クラト", en: "Crato" },
    world: { ja: "静かな潟に沈んだ、無数の昆虫と翼竜", en: "A still lagoon, and the insects and pterosaurs that sank into it" },
    featured: true,
  },

  {
    id: "kayenta",
    band: "early-jurassic",
    query: { stratum: "Kayenta" },
    ageMa: { from: 199, to: 182 },
    currentRegion: "north-america",
    place: { ja: "アメリカ合衆国", en: "United States" },
    name: { ja: "カイエンタ", en: "Kayenta" },
    world: { ja: "砂漠のふちの、季節ごとに流れる川", en: "Seasonal rivers along the edge of a desert" },
    featured: true,
  },
  {
    id: "posidonia",
    band: "early-jurassic",
    query: { stratum: "Posidonienschiefer" },
    ageMa: { from: 185, to: 178 },
    currentRegion: "europe",
    place: { ja: "ドイツ", en: "Germany" },
    name: { ja: "ポシドニア頁岩", en: "Posidonia Shale" },
    world: { ja: "底に酸素のない、静かな黒い海", en: "A still black sea with no oxygen at the bottom" },
    featured: true,
  },
  {
    id: "clarens",
    hub: "karoo",
    band: "early-jurassic",
    query: { stratum: "Clarens" },
    ageMa: { from: 200, to: 180 },
    currentRegion: "africa",
    place: { ja: "南アフリカ", en: "South Africa" },
    name: { ja: "クラレンス", en: "Clarens" },
    world: { ja: "砂に埋もれていく、乾いた高地", en: "A dry upland going under the sand" },
    featured: true,
  },
  {
    id: "cerrejon",
    hub: "colombia",
    band: "paleocene",
    query: { box: { west: -73.2, east: -72.0, south: 10.8, north: 11.6 } },
    ageMa: { from: 62, to: 56 },
    currentRegion: "south-america",
    place: { ja: "コロンビア", en: "Colombia" },
    name: { ja: "セレホン", en: "Cerrejón" },
    world: { ja: "恐竜のいなくなった熱帯雨林と、巨大なヘビ", en: "A rainforest with no dinosaurs in it, and an enormous snake" },
    featured: true,
  },
  {
    id: "nacimiento",
    band: "paleocene",
    query: { stratum: "Nacimiento" },
    ageMa: { from: 65, to: 60 },
    currentRegion: "north-america",
    place: { ja: "アメリカ合衆国", en: "United States" },
    name: { ja: "ナシミエント", en: "Nacimiento" },
    world: { ja: "空いた席を、哺乳類が埋めはじめた平野", en: "A floodplain where mammals began filling the empty seats" },
    featured: true,
  },
  {
    id: "la-brea",
    band: "pleistocene",
    query: { box: { west: -118.6, east: -118.0, south: 33.9, north: 34.3 } },
    ageMa: { from: 0.2, to: 0.005 },
    currentRegion: "north-america",
    place: { ja: "アメリカ合衆国", en: "United States" },
    name: { ja: "ランチョ・ラ・ブレア", en: "Rancho La Brea" },
    world: { ja: "天然のアスファルトに沈んだ、氷期の獣たち", en: "Ice-age animals, caught in natural asphalt" },
    featured: true,
  },
  {
    id: "naracoorte",
    band: "pleistocene",
    query: { box: { west: 140.5, east: 141.0, south: -37.3, north: -36.9 } },
    ageMa: { from: 0.5, to: 0.005 },
    currentRegion: "oceania",
    place: { ja: "オーストラリア", en: "Australia" },
    name: { ja: "ナラクーテ", en: "Naracoorte" },
    world: { ja: "洞窟に落ちて残った、巨大な有袋類", en: "Giant marsupials, kept by the caves they fell into" },
    featured: true,
  },

  {
    id: "much-wenlock",
    hub: "england",
    band: "late-silurian",
    query: { stratum: "Much Wenlock" },
    ageMa: { from: 433, to: 425 },
    currentRegion: "europe",
    place: { ja: "イギリス", en: "United Kingdom" },
    name: { ja: "ウェンロック", en: "Much Wenlock" },
    world: { ja: "赤道の南にあった、サンゴとウミユリの礁", en: "A reef of corals and sea lilies, south of the equator" },
    featured: true,
  },
  {
    id: "bertie",
    band: "late-silurian",
    query: { stratum: "Bertie" },
    ageMa: { from: 425, to: 417 },
    currentRegion: "north-america",
    place: { ja: "アメリカ合衆国", en: "United States" },
    name: { ja: "バーティー", en: "Bertie" },
    world: { ja: "塩の濃い潟に集まった、巨大なウミサソリ", en: "Giant sea scorpions, gathered in a salty lagoon" },
    featured: true,
  },
  {
    id: "oxford-clay",
    hub: "england",
    band: "middle-jurassic",
    query: { stratum: "Oxford Clay" },
    ageMa: { from: 167, to: 160 },
    currentRegion: "europe",
    place: { ja: "イギリス", en: "United Kingdom" },
    name: { ja: "オックスフォード粘土", en: "Oxford Clay" },
    world: { ja: "首長竜と魚竜がすれちがう、泥の海", en: "A muddy sea where plesiosaurs and ichthyosaurs passed each other" },
    featured: true,
  },
  {
    id: "daohugou",
    hub: "liaoning",
    band: "middle-jurassic",
    query: { box: { west: 119.0, east: 119.6, south: 41.0, north: 41.6 } },
    ageMa: { from: 168, to: 156 },
    currentRegion: "asia",
    place: { ja: "中国", en: "China" },
    name: { ja: "道虎溝", en: "Daohugou" },
    world: { ja: "無数の昆虫と、木から木へ滑空する獣の湖", en: "A lake of countless insects, and beasts that glided between trees" },
    featured: true,
  },
  {
    id: "fayum",
    band: "early-oligocene",
    query: { stratum: "Jebel Qatrani" },
    ageMa: { from: 34, to: 28 },
    currentRegion: "africa",
    place: { ja: "エジプト", en: "Egypt" },
    name: { ja: "ファイユーム", en: "Fayum" },
    world: { ja: "サハラになる前の、川と森", en: "Rivers and forest, before any of it was the Sahara" },
    featured: true,
  },
  {
    id: "hsanda-gol",
    band: "early-oligocene",
    query: { stratum: "Hsanda Gol" },
    ageMa: { from: 34, to: 26 },
    currentRegion: "asia",
    place: { ja: "モンゴル", en: "Mongolia" },
    name: { ja: "フサンダゴル", en: "Hsanda Gol" },
    world: { ja: "アジアの内陸が乾きはじめた、赤い平原", en: "A red plain, where inland Asia was beginning to dry" },
    featured: true,
  },
  {
    id: "riversleigh",
    band: "middle-miocene",
    query: { box: { west: 138.5, east: 139.2, south: -19.2, north: -18.7 } },
    ageMa: { from: 25, to: 10 },
    currentRegion: "oceania",
    place: { ja: "オーストラリア", en: "Australia" },
    name: { ja: "リバースレー", en: "Riversleigh" },
    world: { ja: "オーストラリアがまだ雨林だったころ", en: "When Australia was still rainforest" },
    featured: true,
  },
  {
    id: "la-venta",
    hub: "colombia",
    band: "middle-miocene",
    query: { stratum: "Villavieja" },
    ageMa: { from: 16, to: 11 },
    currentRegion: "south-america",
    place: { ja: "コロンビア", en: "Colombia" },
    name: { ja: "ラ・ベンタ", en: "La Venta" },
    world: { ja: "他の大陸から切り離されて育った、奇妙な獣たち", en: "Strange beasts, grown up cut off from every other continent" },
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
