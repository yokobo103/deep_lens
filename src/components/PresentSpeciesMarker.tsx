import { forwardRef, type CSSProperties } from "react";
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
  /** Screen-space declutter only; the anchor stays the real locality. */
  spread: readonly [x: number, y: number];
  onClick?: () => void;
}

/**
 * The same creature, where it is dug up today. It keeps its own shape and only
 * loses its colour, so a Spinosaurus on the ancient Earth is recognisably the
 * same Spinosaurus here — which is the entire point of moving between the two.
 */
export const PresentSpeciesMarker = forwardRef<HTMLButtonElement, PresentSpeciesMarkerProps>(
  function PresentSpeciesMarker({ record, trace, locale, isVisible, isSelected, showLabel, spread, onClick }, ref) {
    const text = localizeLife(record, locale);
    const sites = locale === "ja" ? `${trace.sites}地点` : `${trace.sites} sites`;
    const countries = trace.countries.length > 1
      ? locale === "ja" ? `${trace.countries.length}か国` : `${trace.countries.length} countries`
      : trace.mainCountry;
    return (
      <button
        ref={ref}
        type="button"
        className={`present-species-marker${isVisible ? " is-visible" : ""}${isSelected ? " is-selected" : ""}`}
        onClick={onClick}
        aria-label={`${text.name} — ${sites}`}
        aria-hidden={!isVisible}
        tabIndex={isVisible ? 0 : -1}
        style={{ "--spread-x": `${spread[0]}px`, "--spread-y": `${spread[1]}px` } as CSSProperties}
      >
        <span className="present-species-marker__icon"><LifeIcon iconType={record.iconType} tone="trace" /></span>
        {showLabel && (
          <span className="present-species-marker__label">
            <strong>{text.name}</strong>
            <small>{sites} · {countries}</small>
          </span>
        )}
      </button>
    );
  },
);
