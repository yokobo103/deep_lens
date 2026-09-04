import { forwardRef } from "react";
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
      className={`ancient-life-marker ancient-life-marker--${record.iconType}${record.featured ? " is-featured" : ""}${isVisible ? " is-visible" : ""}`}
      onClick={onClick}
      aria-label={record.name}
      aria-disabled={!onClick}
    >
      <span className="ancient-life-marker__icon"><LifeIcon iconType={record.iconType} /></span>
      {showLabel && <span className="ancient-life-marker__label">{record.name}</span>}
    </button>
  );
});
