import { currentRegionDefinitions, gateById, gateDefinitions, hubIdOf, bandDefinitions, type GateDefinition } from "../data/gates";
import { drawnIn } from "../data/drawn";
import type { EnvClass } from "../data/environment";
import type { GateSummary } from "../data/gateData";
import type { Locale } from "./copy";
import type { Visit } from "./log";

export type AchievementId =
  | "first-journey" | "five-worlds" | "fifteen-worlds" | "every-gate"
  | "deepest-world" | "newest-world" | "three-eras" | "five-bands" | "every-band"
  | "same-place" | "time-well" | "same-region-ages" | "region-well" | "overlapping-time" | "four-ages-one-place"
  | "same-age" | "three-lands-one-age" | "four-lands-one-age" | "whole-band"
  | "seven-continents" | "antarctic" | "polar-world" | "tropical-world" | "pole-to-equator" | "drifted-far"
  | "sea-to-land" | "every-environment" | "thick-record" | "thin-record"
  | "across-extinction" | "one-day-three" | "many-days"
  | "first-hunt" | "inherited-world" | "before-dinosaurs" | "feathers-and-teeth"
  | "highest-branch" | "river-dinosaur" | "smaller-than-thought" | "until-1936" | "curve-of-tusk";

export type AchievementMark =
  | "spark" | "depth" | "layers" | "echo" | "well" | "horizon" | "tide" | "compass"
  | "cluster" | "ring" | "column" | "span" | "pole" | "sun" | "drift" | "ledger"
  | "thin" | "break" | "day" | "calendar" | "globe" | "ice"
  | "grasp" | "after" | "origin" | "feather" | "reach" | "sail" | "sickle" | "stripes" | "tusk";

/** Which shelf of the archive a discovery sits on. */
export type AchievementGroup = "journey" | "time" | "vertical" | "horizontal" | "earth" | "record" | "faces";

export interface AchievementDefinition {
  id: AchievementId;
  group: AchievementGroup;
  mark: AchievementMark;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  isEarned: (evidence: AchievementEvidence) => boolean;
}

export interface AchievementContext {
  visits: readonly Visit[];
  /** Dominant PBDB environment, loaded only for worlds in the journey. */
  environments: ReadonlyMap<string, EnvClass>;
  /** The bake's own numbers, for anything the definitions alone cannot say. */
  summaries: ReadonlyMap<string, GateSummary>;
}

interface AchievementEvidence {
  gates: readonly GateDefinition[];
  environments: ReadonlyMap<string, EnvClass>;
  summaries: ReadonlyMap<string, GateSummary>;
  visits: readonly Visit[];
}

type GeologicalEra = "paleozoic" | "mesozoic" | "cenozoic";

function middleAge(gate: GateDefinition): number {
  return (gate.ageMa.from + gate.ageMa.to) / 2;
}

function geologicalEra(gate: GateDefinition): GeologicalEra {
  const age = middleAge(gate);
  if (age >= 251.9) return "paleozoic";
  if (age >= 66) return "mesozoic";
  return "cenozoic";
}

function hasGroupedVariety(
  gates: readonly GateDefinition[],
  groupBy: (gate: GateDefinition) => string,
  distinguishBy: (gate: GateDefinition) => string,
  minimum: number,
): boolean {
  const groups = new Map<string, Set<string>>();
  for (const gate of gates) {
    const group = groupBy(gate);
    const values = groups.get(group) ?? new Set<string>();
    values.add(distinguishBy(gate));
    groups.set(group, values);
  }
  return [...groups.values()].some((values) => values.size >= minimum);
}

const deepestAge = Math.max(...gateDefinitions.map(middleAge));
const shallowestAge = Math.min(...gateDefinitions.map(middleAge));

/** Great-circle distance in kilometres. */
function kmApart(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const cosine = Math.sin(a.lat * rad) * Math.sin(b.lat * rad)
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos((b.lng - a.lng) * rad);
  return 6371 * Math.acos(Math.min(1, Math.max(-1, cosine)));
}

/**
 * How wide a hub really is, in kilometres of present-day ground.
 *
 * Measured rather than assumed. A hub was described as "the same place" until
 * the distances were taken: Seymour Island is 8 km across, Morocco 169, the
 * Karoo 419, and China — before it was split — 2,437, which is Tokyo to Hong
 * Kong. So most hubs are a region, and only a few are a place. The strict
 * discovery below uses the number instead of the word.
 */
const TIGHT_HUB_KM = 200;

function hubSpreadKm(gates: readonly GateDefinition[], summaries: ReadonlyMap<string, GateSummary>): Map<string, number> {
  const byHub = new Map<string, GateSummary[]>();
  for (const gate of gates) {
    const summary = summaries.get(gate.id);
    if (!summary) continue;
    byHub.set(hubIdOf(gate), [...(byHub.get(hubIdOf(gate)) ?? []), summary]);
  }
  const spread = new Map<string, number>();
  for (const [hub, members] of byHub) {
    let widest = 0;
    for (const a of members) for (const b of members) widest = Math.max(widest, kmApart(a, b));
    spread.set(hub, widest);
  }
  return spread;
}

/** Bands, and how many gates each one holds, so "all of one Earth" is checkable. */
const gatesPerBand = new Map<string, number>();
for (const gate of gateDefinitions) {
  gatesPerBand.set(gate.band, (gatesPerBand.get(gate.band) ?? 0) + 1);
}

/** The band either side of the greatest extinction the gates straddle. */
function bandsAround(fromMa: number, toMa: number): string[] {
  return bandDefinitions
    .filter((band) => band.terrainMa <= fromMa && band.terrainMa >= toMa)
    .map((band) => band.id);
}

const permianBands = bandsAround(300, 252);
const triassicBands = bandsAround(251, 200);

function paleoLat(gate: GateDefinition, summaries: ReadonlyMap<string, GateSummary>): number | null {
  const summary = summaries.get(gate.id);
  return summary ? summary.paleoLat : null;
}

/**
 * Names for ways of travelling, kept apart from their presentation. Adding a
 * discovery should normally mean adding one object here; the menu, archive and
 * quiet notification all read the same definition.
 *
 * Two pairs look almost alike and are not. "Same continent" tests
 * `currentRegion`, which is Africa or North America — Kem Kem and Maevarano
 * count, six thousand kilometres apart. "Same region" tests `hub`, which is
 * Morocco or the Karoo. Both are kept: the first is the way in, the second is
 * the thing the app is actually about, and deleting the easy one would leave a
 * discovery only six of the hubs could ever reach.
 */
/**
 * Whether a species is painted into a scene the reader has stood in.
 *
 * The gate's record is the wrong test: a record holds hundreds of species and
 * a picture holds five, so "in the record" would credit the reader with animals
 * the app never showed them. drawn.ts is the list of what is actually on the
 * canvas, and `npm run verify:scenes` already holds every entry in it against
 * the live record, so asking drawn.ts asks both questions at once.
 */
function metIn(species: string) {
  return ({ gates }: AchievementEvidence) =>
    gates.some((gate) => drawnIn(gate.id).includes(species));
}

export const achievementDefinitions: readonly AchievementDefinition[] = [
  // ---- 旅のはじまり ------------------------------------------------------
  {
    id: "first-journey", group: "journey", mark: "spark",
    name: { ja: "はじめての時間旅行", en: "First journey through time" },
    description: { ja: "初めてひとつの古代世界を訪れた", en: "Visited an ancient world for the first time" },
    isEarned: ({ gates }) => gates.length >= 1,
  },
  {
    id: "five-worlds", group: "journey", mark: "cluster",
    name: { ja: "五つの世界", en: "Five worlds" },
    description: { ja: "五つの古代世界を訪れた", en: "Visited five ancient worlds" },
    isEarned: ({ gates }) => gates.length >= 5,
  },
  {
    id: "fifteen-worlds", group: "journey", mark: "ring",
    name: { ja: "十五の世界", en: "Fifteen worlds" },
    description: { ja: "十五の古代世界を訪れた", en: "Visited fifteen ancient worlds" },
    isEarned: ({ gates }) => gates.length >= 15,
  },
  {
    id: "every-gate", group: "journey", mark: "globe",
    name: { ja: "すべての入り口", en: "Every way in" },
    description: { ja: "収録されているすべての世界を訪れた", en: "Visited every world Deep Lens holds" },
    isEarned: ({ gates }) => gates.length >= gateDefinitions.length,
  },

  // ---- 時代 --------------------------------------------------------------
  {
    id: "deepest-world", group: "time", mark: "depth",
    name: { ja: "最深層へ", en: "Into the deepest layer" },
    description: { ja: "収録されている中で、最も古い世界を訪れた", en: "Visited the oldest world held in Deep Lens" },
    isEarned: ({ gates }) => gates.some((gate) => middleAge(gate) === deepestAge),
  },
  {
    id: "newest-world", group: "time", mark: "day",
    name: { ja: "いちばん近い過去", en: "The nearest past" },
    description: { ja: "収録されている中で、最も新しい世界を訪れた", en: "Visited the youngest world held in Deep Lens" },
    isEarned: ({ gates }) => gates.some((gate) => middleAge(gate) === shallowestAge),
  },
  {
    id: "three-eras", group: "time", mark: "layers",
    name: { ja: "三つの時代", en: "Three eras" },
    description: { ja: "古生代・中生代・新生代を旅した", en: "Travelled through the Paleozoic, Mesozoic and Cenozoic" },
    isEarned: ({ gates }) => new Set(gates.map(geologicalEra)).size === 3,
  },
  {
    id: "five-bands", group: "time", mark: "column",
    name: { ja: "五つの地球", en: "Five Earths" },
    description: { ja: "五つの異なる年代の地球に立った", en: "Stood on five different reconstructed Earths" },
    isEarned: ({ gates }) => new Set(gates.map((gate) => gate.band)).size >= 5,
  },
  {
    id: "every-band", group: "time", mark: "span",
    name: { ja: "すべての地球", en: "Every Earth" },
    description: { ja: "収録されているすべての年代の地球に立った", en: "Stood on every reconstructed Earth Deep Lens holds" },
    isEarned: ({ gates }) => new Set(gates.map((gate) => gate.band)).size >= bandDefinitions.length,
  },
  {
    id: "across-extinction", group: "time", mark: "break",
    name: { ja: "絶滅をまたいで", en: "Across the dying" },
    description: {
      ja: "ペルム紀末の大量絶滅の、前と後の世界をどちらも訪れた",
      en: "Visited a world from before the end-Permian extinction, and one from after",
    },
    isEarned: ({ gates }) => {
      const bands = new Set(gates.map((gate) => gate.band));
      return permianBands.some((band) => bands.has(band)) && triassicBands.some((band) => bands.has(band));
    },
  },

  // ---- 縦：同じところを掘る ------------------------------------------------
  {
    id: "same-place", group: "vertical", mark: "echo",
    name: { ja: "同じ大陸、別の地球", en: "Same continent, another Earth" },
    description: { ja: "同じ現在地域で、異なる時代の世界を訪れた", en: "Visited different ages within the same present-day region" },
    isEarned: ({ gates }) => hasGroupedVariety(gates, (gate) => gate.currentRegion, (gate) => gate.band, 2),
  },
  {
    id: "time-well", group: "vertical", mark: "well",
    name: { ja: "大陸を掘る", en: "Digging a continent" },
    description: { ja: "同じ現在地域で、三つ以上の時代を訪れた", en: "Visited three or more ages within one present-day region" },
    isEarned: ({ gates }) => hasGroupedVariety(gates, (gate) => gate.currentRegion, (gate) => gate.band, 3),
  },
  {
    id: "same-region-ages", group: "vertical", mark: "ring",
    name: { ja: "同じ地域、別の地球", en: "Same region, another Earth" },
    description: {
      ja: "ひとつの地域から、異なる時代のゲートへ入った",
      en: "Entered gates of different ages from one and the same region",
    },
    isEarned: ({ gates }) => hasGroupedVariety(gates, hubIdOf, (gate) => gate.band, 2),
  },
  {
    id: "region-well", group: "vertical", mark: "well",
    name: { ja: "時間の井戸", en: "A well of time" },
    description: {
      ja: "ひとつの地域から、三つの時代へ潜った",
      en: "Went down through three ages from one region",
    },
    isEarned: ({ gates }) => hasGroupedVariety(gates, hubIdOf, (gate) => gate.band, 3),
  },
  {
    id: "four-ages-one-place", group: "vertical", mark: "column",
    name: { ja: "四つの時代を掘る", en: "Four ages, one region" },
    description: {
      ja: "ひとつの地域から、四つの時代へ潜った",
      en: "Went down through four ages from one region",
    },
    isEarned: ({ gates }) => hasGroupedVariety(gates, hubIdOf, (gate) => gate.band, 4),
  },
  {
    id: "overlapping-time", group: "vertical", mark: "echo",
    name: { ja: "時の重なり", en: "Overlapping time" },
    description: {
      ja: "ほとんど同じ地点で、異なる時代の世界を訪れた（半径200 km以内）",
      en: "Visited different ages at what is almost the same spot — within 200 km",
    },
    isEarned: ({ gates, summaries }) => {
      const spread = hubSpreadKm(gates, summaries);
      const bandsByHub = new Map<string, Set<string>>();
      for (const gate of gates) {
        const hub = hubIdOf(gate);
        bandsByHub.set(hub, (bandsByHub.get(hub) ?? new Set()).add(gate.band));
      }
      return [...bandsByHub].some(([hub, bands]) => bands.size >= 2 && (spread.get(hub) ?? Infinity) <= TIGHT_HUB_KM);
    },
  },

  // ---- 横：同じ地球を回る --------------------------------------------------
  {
    id: "same-age", group: "horizontal", mark: "horizon",
    name: { ja: "同じ時代、別の世界", en: "Same age, another world" },
    description: { ja: "同じ年代帯にある、異なる現在地域を訪れた", en: "Visited different present-day regions in the same age band" },
    isEarned: ({ gates }) => hasGroupedVariety(gates, (gate) => gate.band, (gate) => gate.currentRegion, 2),
  },
  {
    id: "three-lands-one-age", group: "horizontal", mark: "cluster",
    name: { ja: "ひとつの時代、三つの大地", en: "One age, three lands" },
    description: { ja: "ひとつの年代帯で、三つの現在地域を訪れた", en: "Visited three present-day regions within one age band" },
    isEarned: ({ gates }) => hasGroupedVariety(gates, (gate) => gate.band, (gate) => gate.currentRegion, 3),
  },
  {
    id: "four-lands-one-age", group: "horizontal", mark: "globe",
    name: { ja: "ひとつの時代、四つの大地", en: "One age, four lands" },
    description: { ja: "ひとつの年代帯で、四つの現在地域を訪れた", en: "Visited four present-day regions within one age band" },
    isEarned: ({ gates }) => hasGroupedVariety(gates, (gate) => gate.band, (gate) => gate.currentRegion, 4),
  },
  {
    id: "whole-band", group: "horizontal", mark: "span",
    name: { ja: "ひとつの地球を隅々まで", en: "One Earth, all of it" },
    description: {
      ja: "ひとつの年代帯にあるすべての世界を訪れた",
      en: "Visited every world standing on one reconstructed Earth",
    },
    isEarned: ({ gates }) => {
      const seen = new Map<string, number>();
      for (const gate of gates) seen.set(gate.band, (seen.get(gate.band) ?? 0) + 1);
      return [...seen].some(([band, count]) => count >= (gatesPerBand.get(band) ?? Infinity));
    },
  },

  // ---- 地球のかたち --------------------------------------------------------
  {
    id: "seven-continents", group: "earth", mark: "compass",
    name: { ja: "七大陸制覇", en: "Across seven continents" },
    description: { ja: "現在の七大陸すべてにある世界を訪れた", en: "Visited worlds in all seven present-day continents" },
    isEarned: ({ gates }) => new Set(gates.map((gate) => gate.currentRegion)).size === currentRegionDefinitions.length,
  },
  {
    id: "antarctic", group: "earth", mark: "ice",
    name: { ja: "氷の下の記憶", en: "Under the ice" },
    description: {
      ja: "いま氷の下にある土地の、氷が無かったころを訪れた",
      en: "Visited land now under ice, from a time when it had none",
    },
    isEarned: ({ gates }) => gates.some((gate) => gate.currentRegion === "antarctica"),
  },
  {
    id: "polar-world", group: "earth", mark: "pole",
    name: { ja: "極に近い世界", en: "A world near the pole" },
    description: {
      ja: "当時、極から30度以内にあった世界を訪れた",
      en: "Visited a world that then lay within 30 degrees of a pole",
    },
    isEarned: ({ gates, summaries }) => gates.some((gate) => {
      const lat = paleoLat(gate, summaries);
      return lat !== null && Math.abs(lat) >= 60;
    }),
  },
  {
    id: "tropical-world", group: "earth", mark: "sun",
    name: { ja: "赤道の世界", en: "A world on the equator" },
    description: {
      ja: "当時、赤道から10度以内にあった世界を訪れた",
      en: "Visited a world that then lay within 10 degrees of the equator",
    },
    isEarned: ({ gates, summaries }) => gates.some((gate) => {
      const lat = paleoLat(gate, summaries);
      return lat !== null && Math.abs(lat) <= 10;
    }),
  },
  {
    id: "pole-to-equator", group: "earth", mark: "span",
    name: { ja: "極から赤道へ", en: "From pole to equator" },
    description: {
      ja: "極に近い世界と、赤道の世界をどちらも訪れた",
      en: "Visited both a near-polar world and an equatorial one",
    },
    isEarned: (evidence) => {
      const lats = evidence.gates.flatMap((gate) => {
        const lat = paleoLat(gate, evidence.summaries);
        return lat === null ? [] : [Math.abs(lat)];
      });
      return lats.some((lat) => lat >= 60) && lats.some((lat) => lat <= 10);
    },
  },
  {
    id: "drifted-far", group: "earth", mark: "drift",
    name: { ja: "動いた大地", en: "Ground that travelled" },
    description: {
      ja: "その後60度以上も緯度を移動した土地を訪れた",
      en: "Visited ground that has since moved more than 60 degrees of latitude",
    },
    isEarned: ({ gates, summaries }) => gates.some((gate) => {
      const summary = summaries.get(gate.id);
      return summary !== undefined && Math.abs(summary.lat - summary.paleoLat) >= 60;
    }),
  },

  // ---- 世界の中身 ----------------------------------------------------------
  {
    id: "sea-to-land", group: "record", mark: "tide",
    name: { ja: "海から陸へ", en: "From sea to land" },
    description: { ja: "海の世界と、大陸の川・湖・陸の世界を旅した", en: "Travelled through both marine and continental worlds" },
    isEarned: ({ gates, environments }) => {
      const kinds = new Set(gates.flatMap((gate) => {
        const kind = environments.get(gate.id);
        return kind && kind !== "unknown" ? [kind] : [];
      }));
      const hasMarine = kinds.has("sea") || kinds.has("coast");
      const hasContinental = kinds.has("fresh") || kinds.has("land");
      return hasMarine && hasContinental;
    },
  },
  {
    id: "every-environment", group: "record", mark: "layers",
    name: { ja: "四つの環境", en: "All four kinds of place" },
    description: {
      ja: "海・沿岸・川と湖・陸のすべてを訪れた",
      en: "Visited the sea, the coast, rivers and lakes, and dry land",
    },
    isEarned: ({ gates, environments }) => {
      const kinds = new Set(gates.flatMap((gate) => {
        const kind = environments.get(gate.id);
        return kind && kind !== "unknown" ? [kind] : [];
      }));
      return (["sea", "coast", "fresh", "land"] satisfies EnvClass[]).every((kind) => kinds.has(kind));
    },
  },
  {
    id: "thick-record", group: "record", mark: "ledger",
    name: { ja: "分厚い記録", en: "A thick record" },
    description: {
      ja: "200種以上が記録された世界を訪れた",
      en: "Visited a world where more than two hundred species are recorded",
    },
    isEarned: ({ gates, summaries }) => gates.some((gate) => (summaries.get(gate.id)?.castTotal ?? 0) >= 200),
  },
  {
    id: "thin-record", group: "record", mark: "thin",
    name: { ja: "わずかな記録", en: "A thin record" },
    description: {
      ja: "30種に満たない、記録の乏しい世界を訪れた",
      en: "Visited a world where fewer than thirty species are recorded",
    },
    isEarned: ({ gates, summaries }) => gates.some((gate) => {
      const cast = summaries.get(gate.id)?.castTotal;
      return cast !== undefined && cast > 0 && cast < 30;
    }),
  },

  // ---- 旅の仕方 ------------------------------------------------------------
  {
    id: "one-day-three", group: "journey", mark: "day",
    name: { ja: "一日に三つの時代", en: "Three ages in one day" },
    description: {
      ja: "同じ日のうちに、三つの世界を訪れた",
      en: "Visited three worlds on the same day",
    },
    isEarned: ({ visits }) => {
      const perDay = new Map<string, number>();
      for (const visit of visits) perDay.set(visit.on, (perDay.get(visit.on) ?? 0) + 1);
      return [...perDay.values()].some((count) => count >= 3);
    },
  },
  {
    id: "many-days", group: "journey", mark: "calendar",
    name: { ja: "幾日もかけて", en: "Over many days" },
    description: {
      ja: "三日以上にわたって旅を続けた",
      en: "Kept travelling across three or more days",
    },
    isEarned: ({ visits }) => new Set(visits.map((visit) => visit.on)).size >= 3,
  },

  // ---- 知っている顔 ------------------------------------------------------
  //
  // The other thirty-two are shapes of travel: how far, how deep, how many
  // Earths. These nine are the opposite — one animal, met once, and the reader
  // already knew its name before they opened this.
  //
  // Every one of them is drawn into its scene, and that is the whole rule. A
  // species can sit in a gate's record without being in its picture — Hell
  // Creek's record holds Tyrannosaurus while its picture holds a leaf, a gar
  // and a turtle — and an achievement that fired on the record would be telling
  // the reader they met something they never saw. So the test is the picture,
  // asked of drawn.ts rather than hard-coded here: if a scene is ever redrawn
  // and an animal leaves it, the discovery leaves with it.
  //
  // Nine, spread on purpose. One per gate, six of the seven present-day
  // regions, and no two in the same band except the two pairs the map forces
  // (Solnhofen with Tendaguru, Naracoorte with La Brea). Antarctica has no
  // famous animal drawn in it, because its two gates are ammonites and clams,
  // and inventing one there would be worse than the gap.
  {
    id: "first-hunt", group: "faces", mark: "grasp",
    name: { ja: "最初の狩り", en: "The first hunt" },
    description: {
      ja: "アノマロカリスに会った。カンブリアの海に現れた、最初の大型捕食者",
      en: "Met Anomalocaris, the first large predator to appear in the sea",
    },
    isEarned: metIn("Anomalocaris canadensis"),
  },
  {
    id: "inherited-world", group: "faces", mark: "after",
    name: { ja: "世界を継いだもの", en: "It inherited the world" },
    description: {
      ja: "リストロサウルスに会った。史上最大の絶滅のあと、陸の脊椎動物のほとんどがこの一属になった",
      en: "Met Lystrosaurus, which after the greatest extinction made up most of the land's vertebrates",
    },
    isEarned: metIn("Lystrosaurus declivis"),
  },
  {
    id: "before-dinosaurs", group: "faces", mark: "origin",
    name: { ja: "すべての恐竜の前に", en: "Before any dinosaur" },
    description: {
      ja: "ヘレラサウルスに会った。知られている中で最初期の恐竜のひとつ",
      en: "Met Herrerasaurus, one of the earliest dinosaurs known",
    },
    isEarned: metIn("Herrerasaurus ischigualastensis"),
  },
  {
    id: "feathers-and-teeth", group: "faces", mark: "feather",
    name: { ja: "羽と歯", en: "Feathers, and teeth" },
    description: {
      ja: "始祖鳥に会った。羽根を持ち、歯を持ち、翼の先に指があった",
      en: "Met Archaeopteryx, which had feathers, teeth, and fingers on its wings",
    },
    isEarned: metIn("Archaeopteryx lithographica"),
  },
  {
    id: "highest-branch", group: "faces", mark: "reach",
    name: { ja: "いちばん高い枝", en: "The highest branch" },
    description: {
      ja: "ギラファティタンに会った。長くブラキオサウルスと呼ばれてきた、首の長い巨体",
      en: "Met Giraffatitan, the long-necked giant long known as Brachiosaurus",
    },
    isEarned: metIn("Giraffatitan brancai"),
  },
  {
    id: "river-dinosaur", group: "faces", mark: "sail",
    name: { ja: "川にいた恐竜", en: "A dinosaur in the river" },
    description: {
      ja: "スピノサウルスに会った。背に帆を持ち、水に入って魚を追った",
      en: "Met Spinosaurus, which carried a sail and went into the water after fish",
    },
    isEarned: metIn("Spinosaurus aegyptiacus"),
  },
  {
    id: "smaller-than-thought", group: "faces", mark: "sickle",
    name: { ja: "思っていたより小さい", en: "Smaller than you thought" },
    description: {
      ja: "ヴェロキラプトルに会った。全身に羽毛があり、七面鳥ほどの大きさだった",
      en: "Met Velociraptor, feathered all over and about the size of a turkey",
    },
    isEarned: metIn("Velociraptor mongoliensis"),
  },
  {
    id: "until-1936", group: "faces", mark: "stripes",
    name: { ja: "1936年まで", en: "Until 1936" },
    description: {
      ja: "フクロオオカミに会った。最後の一頭が死んだのは1936年",
      en: "Met the thylacine. The last one died in 1936",
    },
    isEarned: metIn("Thylacinus cynocephalus"),
  },
  {
    id: "curve-of-tusk", group: "faces", mark: "tusk",
    name: { ja: "牙の弧", en: "The curve of a tusk" },
    description: {
      ja: "コロンビアマンモスに会った。長く湾曲した牙を持つ、氷期の巨獣",
      en: "Met the Columbian mammoth, an ice-age giant with long curving tusks",
    },
    isEarned: metIn("Mammuthus columbi"),
  },
] as const;

export function evaluateAchievements({ visits, environments, summaries }: AchievementContext): AchievementDefinition[] {
  const uniqueIds = new Set(visits.map((visit) => visit.gateId));
  const gates = [...uniqueIds].flatMap((id) => {
    const gate = gateById(id);
    return gate ? [gate] : [];
  });
  const evidence = { gates, environments, summaries, visits };
  return achievementDefinitions.filter((achievement) => achievement.isEarned(evidence));
}
