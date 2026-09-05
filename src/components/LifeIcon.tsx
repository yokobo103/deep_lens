import type { CSSProperties } from "react";
import { ancientIcon, iconSource } from "./iconRegistry";

interface LifeIconProps {
  /** A data category ("theropod", "delta") — resolved through the registry. */
  iconType?: string;
  /** An artwork id ("trace-bone") — used directly. Wins over `iconType`. */
  iconId?: string;
}

/**
 * Drawn as a mask filled with `currentColor`, not as an image, so one file
 * serves every colour the app tints markers with. Sized in `em` so the
 * surrounding font-size rules keep controlling how big it is.
 */
export function LifeIcon({ iconType, iconId }: LifeIconProps) {
  const id = iconId ?? ancientIcon(iconType ?? "");
  const source = iconSource(id);
  if (!source) return null;
  return <span className="life-icon" aria-hidden="true" style={{ "--icon-source": `url(${source})` } as CSSProperties} />;
}
