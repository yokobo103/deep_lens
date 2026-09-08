import { currentRegionDefinitions, gateById, gateDefinitions, type GateDefinition } from "../data/gates";
import type { EnvClass } from "../data/environment";
import type { Locale } from "./copy";
import type { Visit } from "./log";

export type AchievementId =
  | "first-journey"
  | "deepest-world"
  | "three-eras"
  | "same-place"
  | "time-well"
  | "same-age"
  | "sea-to-land"
  | "seven-continents";

export type AchievementMark = "spark" | "depth" | "layers" | "echo" | "well" | "horizon" | "tide" | "compass";

export interface AchievementDefinition {
  id: AchievementId;
  mark: AchievementMark;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  isEarned: (evidence: AchievementEvidence) => boolean;
}

export interface AchievementContext {
  visits: readonly Visit[];
  /** Dominant PBDB environment, loaded only for worlds in the journey. */
  environments: ReadonlyMap<string, EnvClass>;
}

interface AchievementEvidence {
  gates: readonly GateDefinition[];
  environments: ReadonlyMap<string, EnvClass>;
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

/**
 * Names for ways of travelling, kept apart from their presentation. Adding a
 * discovery should normally mean adding one object here; the menu, archive and
 * quiet notification all read the same definition.
 */
export const achievementDefinitions: readonly AchievementDefinition[] = [
  {
    id: "first-journey",
    mark: "spark",
    name: { ja: "はじめての時間旅行", en: "First journey through time" },
    description: { ja: "初めてひとつの古代世界を訪れた", en: "Visited an ancient world for the first time" },
    isEarned: ({ gates }) => gates.length >= 1,
  },
  {
    id: "deepest-world",
    mark: "depth",
    name: { ja: "最深層へ", en: "Into the deepest layer" },
    description: { ja: "収録されている中で、最も古い世界を訪れた", en: "Visited the oldest world held in Deep Lens" },
    isEarned: ({ gates }) => gates.some((gate) => middleAge(gate) === deepestAge),
  },
  {
    id: "three-eras",
    mark: "layers",
    name: { ja: "三つの時代", en: "Three eras" },
    description: { ja: "古生代・中生代・新生代を旅した", en: "Travelled through the Paleozoic, Mesozoic and Cenozoic" },
    isEarned: ({ gates }) => new Set(gates.map(geologicalEra)).size === 3,
  },
  {
    id: "same-place",
    mark: "echo",
    name: { ja: "同じ場所、別の地球", en: "Same place, another Earth" },
    description: { ja: "同じ現在地域で、異なる時代の世界を訪れた", en: "Visited different ages within the same present-day region" },
    isEarned: ({ gates }) => hasGroupedVariety(gates, (gate) => gate.currentRegion, (gate) => gate.band, 2),
  },
  {
    id: "time-well",
    mark: "well",
    name: { ja: "時間の井戸", en: "A well of time" },
    description: { ja: "同じ現在地域で、三つ以上の時代を訪れた", en: "Visited three or more ages within one present-day region" },
    isEarned: ({ gates }) => hasGroupedVariety(gates, (gate) => gate.currentRegion, (gate) => gate.band, 3),
  },
  {
    id: "same-age",
    mark: "horizon",
    name: { ja: "同じ時代、別の世界", en: "Same age, another world" },
    description: { ja: "同じ年代帯にある、異なる現在地域を訪れた", en: "Visited different present-day regions in the same age band" },
    isEarned: ({ gates }) => hasGroupedVariety(gates, (gate) => gate.band, (gate) => gate.currentRegion, 2),
  },
  {
    id: "sea-to-land",
    mark: "tide",
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
    id: "seven-continents",
    mark: "compass",
    name: { ja: "七大陸制覇", en: "Across seven continents" },
    description: { ja: "現在の七大陸すべてにある世界を訪れた", en: "Visited worlds in all seven present-day continents" },
    isEarned: ({ gates }) => new Set(gates.map((gate) => gate.currentRegion)).size === currentRegionDefinitions.length,
  },
] as const;

export function evaluateAchievements({ visits, environments }: AchievementContext): AchievementDefinition[] {
  const uniqueIds = new Set(visits.map((visit) => visit.gateId));
  const gates = [...uniqueIds].flatMap((id) => {
    const gate = gateById(id);
    return gate ? [gate] : [];
  });
  const evidence = { gates, environments };
  return achievementDefinitions.filter((achievement) => achievement.isEarned(evidence));
}

