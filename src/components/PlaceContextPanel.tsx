import type { ColumnBand } from "../data/pbdb";

interface PlaceContextPanelProps {
  lat: number;
  lng: number;
  bands: readonly ColumnBand[];
  loading: boolean;
  onClose: () => void;
  onOpenEvidence: () => void;
}

function formatCoordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(1)}°${value >= 0 ? positive : negative}`;
}

export function PlaceContextPanel({ lat, lng, bands, loading, onClose, onOpenEvidence }: PlaceContextPanelProps) {
  const evidenceLabel = loading
    ? "READING NEARBY EVIDENCE…"
    : bands.length > 0
      ? `OPEN STRATA EVIDENCE · ${bands.length}`
      : "NO NEARBY STRATA RECORD";

  return (
    <aside className="place-context-panel" aria-label="Selected place">
      <button type="button" className="fossil-info-panel__close" onClick={onClose} aria-label="Close selected place">×</button>
      <p className="fossil-eyebrow">PLACE · PRESENT</p>
      <h2>
        {formatCoordinate(lat, "N", "S")} · {formatCoordinate(lng, "E", "W")}
      </h2>
      <p>Keep the globe in view. Open the fossil record only when you want the evidence beneath this place.</p>
      <div className="place-context-panel__axes" aria-label="Place context">
        <span><small>TIME</small><strong>Present</strong></span>
        <span><small>LIFE</small><strong>Traces</strong></span>
        <span><small>ENVIRONMENT</small><strong>Recorded layers</strong></span>
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
