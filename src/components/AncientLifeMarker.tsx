import { forwardRef, type CSSProperties } from "react";
import type { AncientLifeRecord } from "../data/ancientLife";
import { LifeIcon } from "./LifeIcon";

interface AncientLifeMarkerProps {
  record: AncientLifeRecord;
  isVisible: boolean;
  showLabel: boolean;
  onClick?: () => void;
}

export const AncientLifeMarker = forwardRef<HTMLButtonElement, AncientLifeMarkerProps>(function AncientLifeMarker({ record, isVisible, showLabel, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`ancient-life-marker ancient-life-marker--${record.iconType}${record.recordType === "ecosystem" ? " is-ecosystem" : ""}${record.featured ? " is-featured" : ""}${isVisible ? " is-visible" : ""}`}
      onClick={onClick}
      aria-label={`${record.name} — ${record.regionLabel}`}
      aria-disabled={!onClick}
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      style={{
        "--marker-offset-x": `${record.markerOffset?.[0] ?? 0}px`,
        "--marker-offset-y": `${record.markerOffset?.[1] ?? 0}px`,
      } as CSSProperties}
    >
      <span className="ancient-life-marker__icon"><LifeIcon iconType={record.iconType} /></span>
      {showLabel && <span className="ancient-life-marker__label">{record.name}</span>}
    </button>
  );
});
