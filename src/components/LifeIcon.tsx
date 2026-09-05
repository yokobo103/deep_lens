import type { CSSProperties } from "react";
import { ancientIcon, iconSource, type IconTone } from "./iconRegistry";

interface LifeIconProps {
  /** A data category ("theropod", "delta") — resolved through the registry. */
  iconType?: string;
  /** An artwork id ("trace-bone") — used directly. Wins over `iconType`. */
  iconId?: string;
  /** Alive and in colour, or left behind and in brown. */
  tone?: IconTone;
}

/**
 * Drawn as a background image rather than a tinted mask: these icons carry
 * their shape in interior lines — shell ribs, the spiral of an ammonite — and
 * flattening them to a silhouette turned every shell into the same blob.
 * Sized in `em` so the surrounding font-size still decides how big it is.
 */
export function LifeIcon({ iconType, iconId, tone = "living" }: LifeIconProps) {
  const id = iconId ?? ancientIcon(iconType ?? "");
  const source = iconSource(id, tone);
  if (!source) return null;
  return <span className="life-icon" aria-hidden="true" style={{ "--icon-source": `url(${source})` } as CSSProperties} />;
}
