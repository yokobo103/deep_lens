import { forwardRef } from "react";
import type { PresentTraceRecord } from "../data/presentTraces";

interface PresentTraceMarkerProps {
  record: PresentTraceRecord;
  isVisible: boolean;
  isEntering: boolean;
  onClick: () => void;
}

export const PresentTraceMarker = forwardRef<HTMLButtonElement, PresentTraceMarkerProps>(function PresentTraceMarker({ record, isVisible, isEntering, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`present-trace-marker${record.featured ? " is-featured" : ""}${isVisible ? " is-visible" : ""}${isEntering ? " is-entering" : ""}`}
      onClick={onClick}
      aria-label={`${record.name} — ${record.placeLabel}`}
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
    >
      <span className="present-trace-marker__pulse" aria-hidden="true" />
      <span className="present-trace-marker__icon" aria-hidden="true">🦴</span>
      <span className="present-trace-marker__label">
        <strong>{record.placeLabel}</strong>
        <small>{record.formationLabel}</small>
      </span>
    </button>
  );
});
