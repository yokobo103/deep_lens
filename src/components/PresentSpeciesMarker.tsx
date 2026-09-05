import { forwardRef } from "react";
import type { AncientLifeRecord } from "../data/ancientLife";
import type { TaxonTrace } from "../data/pbdb";
import { LifeIcon } from "./LifeIcon";
import { localizeLife, type Locale } from "../fossil/localization";

interface PresentSpeciesMarkerProps {
  record: AncientLifeRecord;
  trace: TaxonTrace;
  locale: Locale;
  isVisible: boolean;
  isSelected: boolean;
  showLabel: boolean;
  onClick?: () => void;
}

/**
 * The same creature, where it is dug up today. It keeps its own shape and only
 * loses its colour, so a Spinosaurus on the ancient Earth is recognisably the
 * same Spinosaurus here — which is the entire point of moving between the two.
 */
export const PresentSpeciesMarker = forwardRef<HTMLButtonElement, PresentSpeciesMarkerProps>(
  function PresentSpeciesMarker({ record, trace, locale, isVisible, isSelected, showLabel, onClick }, ref) {
    const text = localizeLife(record, locale);
    return (
      <button
        ref={ref}
        type="button"
        className={`present-species-marker${isVisible ? " is-visible" : ""}${isSelected ? " is-selected" : ""}`}
        onClick={onClick}
        aria-label={`${text.name} — ${trace.sites}`}
        aria-hidden={!isVisible}
        tabIndex={isVisible ? 0 : -1}
      >
        <span className="present-species-marker__icon"><LifeIcon iconType={record.iconType} tone="trace" /></span>
        {showLabel && <span className="present-species-marker__label"><strong>{text.name}</strong></span>}
      </button>
    );
  },
);
