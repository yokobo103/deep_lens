interface LifeIconProps {
  iconType: string;
}

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

export function LifeIcon({ iconType }: LifeIconProps) {
  return <span aria-hidden="true">{icons[iconType] ?? "✦"}</span>;
}
