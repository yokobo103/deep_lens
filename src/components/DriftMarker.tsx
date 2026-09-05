import { forwardRef } from "react";
import { LifeIcon } from "./LifeIcon";

interface DriftMarkerProps {
  fromIcon: string;
  toIcon: string;
  fromLabel: string;
  toLabel: string;
}

/**
 * The single marker that survives a time shift. It is deliberately one element
 * holding both faces: the living creature and the bone are the same thing seen
 * from two ages, so they must not be two markers that swap.
 */
export const DriftMarker = forwardRef<HTMLDivElement, DriftMarkerProps>(function DriftMarker({ fromIcon, toIcon, fromLabel, toLabel }, ref) {
  return (
    <div ref={ref} className="drift-marker" aria-hidden="true">
      <span className="drift-marker__ring" />
      <span className="drift-marker__faces">
        <span className="drift-marker__face drift-marker__face--from"><LifeIcon iconId={fromIcon} /></span>
        <span className="drift-marker__face drift-marker__face--to"><LifeIcon iconId={toIcon} /></span>
      </span>
      <span className="drift-marker__labels">
        <strong className="drift-marker__label drift-marker__label--from">{fromLabel}</strong>
        <strong className="drift-marker__label drift-marker__label--to">{toLabel}</strong>
      </span>
    </div>
  );
});

/** Where the place used to be. It stays put and fades, so the gap is visible. */
export const DriftGhost = forwardRef<HTMLDivElement, { icon: string; label: string }>(function DriftGhost({ icon, label }, ref) {
  return (
    <div ref={ref} className="drift-ghost" aria-hidden="true">
      <span className="drift-ghost__icon"><LifeIcon iconId={icon} /></span>
      <small>{label}</small>
    </div>
  );
});
