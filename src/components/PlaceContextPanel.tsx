import type { ColumnBand } from "../data/pbdb";
import { fossilCopy, type Locale } from "../fossil/localization";

interface PlaceContextPanelProps {
  lat: number;
  lng: number;
  locale: Locale;
  bands: readonly ColumnBand[];
  loading: boolean;
  onClose: () => void;
  onOpenEvidence: () => void;
}

function formatCoordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(1)}°${value >= 0 ? positive : negative}`;
}

export function PlaceContextPanel({ lat, lng, locale, bands, loading, onClose, onOpenEvidence }: PlaceContextPanelProps) {
  const copy = fossilCopy[locale];
  const evidenceLabel = loading
    ? copy.readingEvidence
    : bands.length > 0
      ? copy.openStrata(bands.length)
      : copy.noNearbyStrata;

  return (
    <aside className="place-context-panel" aria-label={copy.selectedPlace}>
      <button type="button" className="fossil-info-panel__close" onClick={onClose} aria-label={copy.closePlace}>×</button>
      <p className="fossil-eyebrow">{copy.place} · {copy.present}</p>
      <h2>
        {formatCoordinate(lat, "N", "S")} · {formatCoordinate(lng, "E", "W")}
      </h2>
      <p>{copy.keepGlobeVisible}</p>
      <div className="place-context-panel__axes" aria-label={copy.selectedPlace}>
        <span><small>{copy.time}</small><strong>{copy.present}</strong></span>
        <span><small>{copy.life}</small><strong>{copy.traces}</strong></span>
        <span><small>{copy.environment}</small><strong>{copy.recordedLayers}</strong></span>
      </div>
      <button
        type="button"
        className="fossil-panel-action fossil-panel-action--quiet"
        disabled={loading || bands.length === 0}
        onClick={onOpenEvidence}
      >
        {evidenceLabel}
      </button>
    </aside>
  );
}
