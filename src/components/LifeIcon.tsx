import { lifeIconGlyph } from "./lifeIcons";

interface LifeIconProps {
  iconType: string;
}

export function LifeIcon({ iconType }: LifeIconProps) {
  return <span aria-hidden="true">{lifeIconGlyph(iconType)}</span>;
}
