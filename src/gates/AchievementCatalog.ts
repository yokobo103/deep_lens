import { currentRegionDefinitions, gateById, gateDefinitions, hubIdOf, bandDefinitions, type GateDefinition } from "../data/gates";
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
  | "across-extinction" | "one-day-three" | "many-days";

export type AchievementMark =
  | "spark" | "depth" | "layers" | "echo" | "well" | "horizon" | "tide" | "compass"
  | "cluster" | "ring" | "column" | "span" | "pole" | "sun" | "drift" | "ledger"
  | "thin" | "break" | "day" | "calendar" | "globe" | "ice";

/** Which shelf of the archive a discovery sits on. */
export type AchievementGroup = "journey" | "time" | "vertical" | "horizontal" | "earth" | "record";

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
