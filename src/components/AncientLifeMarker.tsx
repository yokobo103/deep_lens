import { forwardRef, type CSSProperties } from "react";
import type { AncientLifeRecord } from "../data/ancientLife";
import { LifeIcon } from "./LifeIcon";
import { localizeLife, type Locale } from "../fossil/localization";

interface AncientLifeMarkerProps {
  record: AncientLifeRecord;
  locale: Locale;
  isVisible: boolean;
  showLabel: boolean;
  isSelected: boolean;
  isEntering: boolean;
  onClick?: () => void;
}

export const AncientLifeMarker = forwardRef<HTMLButtonElement, AncientLifeMarkerProps>(function AncientLifeMarker({ record, locale, isVisible, showLabel, isSelected, isEntering, onClick }, ref) {
  const text = localizeLife(record, locale);
  return (
    <button
      ref={ref}
      type="button"
      className={`ancient-life-marker ancient-life-marker--${record.iconType}${record.recordType === "ecosystem" ? " is-ecosystem" : ""}${record.featured ? " is-featured" : ""}${isVisible ? " is-visible" : ""}${isSelected ? " is-selected" : ""}${isEntering ? " is-entering" : ""}`}
      onClick={onClick}
      aria-label={`${text.name} — ${text.regionLabel}`}
      aria-disabled={!onClick}
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      style={{
        "--marker-offset-x": `${record.markerOffset?.[0] ?? 0}px`,
        "--marker-offset-y": `${record.markerOffset?.[1] ?? 0}px`,
      } as CSSProperties}
    >
      <span className="ancient-life-marker__icon"><LifeIcon iconType={record.iconType} /></span>
      {showLabel && <span className="ancient-life-marker__label">{text.name}</span>}
    </button>
  );
});
