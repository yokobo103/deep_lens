/** Placeholder glyphs. They are stand-ins until real silhouettes exist. */
const icons: Record<string, string> = {
  cluster: "✣",
  crocodilian: "🐊",
  delta: "≋",
  fish: "🐟",
  floodplain: "⌁",
  forest: "♠",
  herbivore: "🦖",
  plant: "🌿",
  pterosaur: "🪽",
  ray: "◇",
  sauropod: "🦕",
  sea: "≈",
  shark: "◢",
  shell: "◒",
  spinosaurus: "🦕",
  theropod: "🦖",
  water: "≈",
};

export function lifeIconGlyph(iconType: string): string {
  return icons[iconType] ?? "✦";
}
