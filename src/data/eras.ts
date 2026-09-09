/** The three big divisions, and the ages they cover. */
export const ERAS = [
  { id: "paleozoic", from: 540, to: 252, ja: "古生代", en: "Paleozoic" },
  { id: "mesozoic", from: 252, to: 66, ja: "中生代", en: "Mesozoic" },
  { id: "cenozoic", from: 66, to: 0, ja: "新生代", en: "Cenozoic" },
] as const;

export const OLDEST_MA = 540;

export function eraOf(ma: number): (typeof ERAS)[number] {
  return ERAS.find((era) => ma <= era.from && ma > era.to) ?? ERAS[2];
}

/**
 * A compact, human-facing age for the exploration UI.
 *
 * Keep this formatter here so cards, age pickers, and the world detail all
 * speak the same language. The archive has its own agePhrase() because it is
 * intentionally a quieter, sentence-like view of the journey.
 */
export function agePlate(ma: number, locale: "ja" | "en" = "ja"): string {
  if (locale === "en") {
    if (ma < 1) return `~${Math.max(1, Math.round(ma * 1000))}K yrs ago`;
    return `~${Math.max(1, Math.round(ma))}M yrs ago`;
  }

  if (ma < 0.01) return `約${Math.max(1, Math.round(ma * 1_000_000)).toLocaleString("ja-JP")}年前`;
  if (ma < 100) return `約${Math.max(1, Math.round(ma * 100)).toLocaleString("ja-JP")}万年前`;

  const oku = Math.round((ma / 100) * 100) / 100;
  return `約${oku.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}億年前`;
}
