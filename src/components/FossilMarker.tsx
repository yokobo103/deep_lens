import { forwardRef } from "react";
import { LifeIcon } from "./LifeIcon";

interface MarkerProps {
  label: string;
  placeLabel: string;
  onClick: () => void;
}

export const FossilMarker = forwardRef<HTMLButtonElement, MarkerProps>(function FossilMarker({ label, placeLabel, onClick }, ref) {
  return (
    <button ref={ref} type="button" className="fossil-marker fossil-marker--bone" onClick={onClick} aria-label={`${label} — ${placeLabel}`}>
      <span className="fossil-marker__icon"><LifeIcon iconId="trace-bone" tone="trace" /></span>
      <span className="fossil-marker__label">FOSSIL SITE</span>
    </button>
  );
});
