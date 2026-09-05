import { forwardRef } from "react";
import { LifeIcon } from "./LifeIcon";

interface DriftMarkerProps {
  fromIcon: string;
  toIcon: string;
  /** "to-present" drains the colour; "to-ancient" brings it back. */
  direction: "to-present" | "to-ancient";
  fromLabel: string;
  toLabel: string;
}

/**
 * The single marker that survives a time shift. It is deliberately one element
 * holding both faces: the living creature and the bone are the same thing seen
 * from two ages, so they must not be two markers that swap.
 */
export const DriftMarker = forwardRef<HTMLDivElement, DriftMarkerProps>(function DriftMarker({ fromIcon, toIcon, direction, fromLabel, toLabel }, ref) {
  return (
    <div ref={ref} className="drift-marker" aria-hidden="true">
      <span className="drift-marker__ring" />
      <span className="drift-marker__faces">
        <span className="drift-marker__face drift-marker__face--from"><LifeIcon iconId={fromIcon} tone={direction === "to-present" ? "living" : "trace"} /></span>
        <span className="drift-marker__face drift-marker__face--to"><LifeIcon iconId={toIcon} tone={direction === "to-present" ? "trace" : "living"} /></span>
      </span>
      <span className="drift-marker__labels">
        <strong className="drift-marker__label drift-marker__label--from">{fromLabel}</strong>
        <strong className="drift-marker__label drift-marker__label--to">{toLabel}</strong>
      </span>
    </div>
  );
});

/** Where the place used to be. It stays put and fades, so the gap is visible. */
export const DriftGhost = forwardRef<HTMLDivElement, { icon: string; label: string; tone: "living" | "trace" }>(function DriftGhost({ icon, label, tone }, ref) {
  return (
    <div ref={ref} className="drift-ghost" aria-hidden="true">
      <span className="drift-ghost__icon"><LifeIcon iconId={icon} tone={tone} /></span>
      <small>{label}</small>
    </div>
  );
});
