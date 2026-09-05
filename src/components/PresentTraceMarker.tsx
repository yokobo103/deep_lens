import { forwardRef } from "react";
import type { PresentTraceRecord } from "../data/presentTraces";
import { localizeTrace, type Locale } from "../fossil/localization";
import { LifeIcon } from "./LifeIcon";
import { regionTraceIcon } from "./iconRegistry";

interface PresentTraceMarkerProps {
  record: PresentTraceRecord;
  locale: Locale;
  isVisible: boolean;
  isEntering: boolean;
  isSelected: boolean;
  selectedTaxonName?: string;
  /** The trace of the selected creature, when one is selected. */
  traceIconId?: string;
  onClick: () => void;
}

export const PresentTraceMarker = forwardRef<HTMLButtonElement, PresentTraceMarkerProps>(function PresentTraceMarker({ record, locale, isVisible, isEntering, isSelected, selectedTaxonName, traceIconId, onClick }, ref) {
  const text = localizeTrace(record, locale);
  const markerTitle = selectedTaxonName ?? text.placeLabel;
  const markerSubtitle = selectedTaxonName ? locale === "ja" ? "化石記録" : "FOSSIL RECORD" : text.formationLabel;
  return (
    <button
      ref={ref}
      type="button"
      className={`present-trace-marker${record.featured ? " is-featured" : ""}${isVisible ? " is-visible" : ""}${isEntering ? " is-entering" : ""}${isSelected ? " is-selected" : ""}`}
      onClick={onClick}
      aria-label={`${selectedTaxonName ?? text.name} — ${text.placeLabel}`}
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
    >
      <span className="present-trace-marker__pulse" aria-hidden="true" />
      <span className="present-trace-marker__icon"><LifeIcon iconId={traceIconId ?? regionTraceIcon(record.regionId)} tone="trace" /></span>
      <span className="present-trace-marker__label">
        <strong>{markerTitle}</strong>
        <small>{markerSubtitle}</small>
      </span>
    </button>
  );
});
