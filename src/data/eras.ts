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

/** "約475 Ma" — the way every part of the app writes an age. */
export function agePlate(ma: number): string {
  return `約${Math.round(ma)} Ma`;
}
