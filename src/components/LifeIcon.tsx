interface LifeIconProps {
  iconType: string;
}

const icons: Record<string, string> = {
  cluster: "✣",
  crocodilian: "🐊",
  fish: "🐟",
  herbivore: "🦖",
  plant: "🌿",
  pterosaur: "🪽",
  spinosaurus: "🦕",
  theropod: "🦖",
  water: "≈",
};

export function LifeIcon({ iconType }: LifeIconProps) {
  return <span aria-hidden="true">{icons[iconType] ?? "✦"}</span>;
}
