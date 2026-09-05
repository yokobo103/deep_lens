/**
 * PBDB records an environment with most collections, in a vocabulary of a few
 * hundred phrases. This folds them into the four kinds of world Deep Lens
 * draws, so a gate can say what kind of place it was without anyone writing a
 * description of it.
 *
 * Order matters: "marginal marine" and "delta plain" have to be caught by
 * `coast` before the `sea` keywords see them.
 *
 * Kept from the stage-based bake that this replaced. The classification was the
 * only thing in that tool worth carrying over, and it belongs next to the app
 * that reads the environments rather than inside a script that no longer runs.
 */

export type EnvClass = "sea" | "coast" | "fresh" | "land" | "unknown";

const KEYWORDS: ReadonlyArray<readonly [EnvClass, readonly string[]]> = [
  ["coast", ["deltaic", "delta plain", "delta front", "prodelta", "interdistributary", "estuary", "lagoon", "coastal", "marginal marine", "paralic"]],
  ["sea", ["marine", "subtidal", "offshore", "reef", "buildup", "bioherm", "basinal", "carbonate", "slope", "shelf", "deep-water", "peritidal", "intertidal", "foreshore", "shoreface", "transition zone", "submarine", "sand shoal", "perireef", "platform", "ramp", "deep subtidal", "sea"]],
  ["fresh", ["fluvial", "channel", "floodplain", "levee", "crevasse", "lacustrine", "crater lake", "spring", "pond", "mire", "swamp", "marsh", "alluvial", "delta"]],
  ["land", ["terrestrial", "eolian", "dune", "interdune", "loess", "cave", "fissure", "sinkhole", "tar", "glacial", "karst"]],
];

export const ENV_LABEL: Record<EnvClass, { ja: string; en: string }> = {
  sea: { ja: "海", en: "Sea" },
  coast: { ja: "沿岸・デルタ", en: "Coast and delta" },
  fresh: { ja: "川・湖", en: "River and lake" },
  land: { ja: "陸", en: "Dry land" },
  unknown: { ja: "記録なし", en: "Not recorded" },
};

export const ENV_COLOR: Record<EnvClass, string> = {
  sea: "#378add",
  coast: "#1d9e75",
  fresh: "#97c459",
  land: "#ef9f27",
  unknown: "#6f7b7a",
};

export function classifyEnvironment(raw: string | null | undefined): EnvClass {
  if (!raw) return "unknown";
  const value = raw.toLowerCase();
  for (const [kind, keywords] of KEYWORDS) {
    if (keywords.some((keyword) => value.includes(keyword))) return kind;
  }
  return "unknown";
}

/** The kind of world a gate's records describe, most recorded first. */
export function dominantEnvironment(environments: ReadonlyArray<readonly [string, number]>): EnvClass {
  const totals = new Map<EnvClass, number>();
  for (const [raw, count] of environments) {
    const kind = classifyEnvironment(raw);
    totals.set(kind, (totals.get(kind) ?? 0) + count);
  }
  const ranked = [...totals.entries()].filter(([kind]) => kind !== "unknown").sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? "unknown";
}
