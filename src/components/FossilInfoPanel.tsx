import type { FossilRecord } from "../data/fossils";
import type { AncientLifeRecord } from "../data/ancientLife";
import type { PresentTraceRecord } from "../data/presentTraces";
import type { FossilTimeMode } from "./TimeModeToggle";
import { LifeIcon } from "./LifeIcon";

interface FossilInfoPanelProps {
  record: FossilRecord;
  mode: FossilTimeMode;
  life: AncientLifeRecord;
  trace: PresentTraceRecord;
  onClose: () => void;
  onSeeFossilsToday: () => void;
  onBackToAncient: () => void;
}

export function FossilInfoPanel({ record, mode, life, trace, onClose, onSeeFossilsToday, onBackToAncient }: FossilInfoPanelProps) {
  const ancient = mode === "ancient";
  const title = ancient ? life.name : trace.name;

  return (
    <aside className="fossil-info-panel" aria-label={`${title} information`}>
      <button type="button" className="fossil-info-panel__close" onClick={onClose} aria-label="Close information">×</button>
      <p className="fossil-eyebrow">{ancient ? `${life.recordType === "ecosystem" ? "REGIONAL WORLD" : "ANCIENT LIFE"} · CENOMANIAN` : "FOSSIL DISCOVERY · PRESENT"}</p>
      <div className="fossil-info-panel__title-row">
        <span className="fossil-info-panel__species-mark" aria-hidden="true">{ancient ? <LifeIcon iconType={life.iconType} /> : "🦴"}</span>
        <div>
          <h2>{title}</h2>
          <p>{ancient ? `${life.regionLabel} · ${life.category}` : `${trace.placeLabel} · ${record.ageLabel} rocks`}</p>
        </div>
      </div>

      {ancient ? (
        <div className="fossil-location-compare">
          <div className="is-current">
            <span>PLACE · RECONSTRUCTED</span>
            <strong>{life.regionLabel}</strong>
            <small>{formatCoordinate(life.lat, "N", "S")} · {formatCoordinate(life.lng, "E", "W")}</small>
          </div>
          <div>
            <span>ROCK RECORD</span>
            <strong>{life.formationLabel}</strong>
            <small>Cenomanian window · ~100.5–93.9 Ma</small>
          </div>
        </div>
      ) : (
        <div className="fossil-location-compare">
          <div className="is-current">
            <span>NOW · DISCOVERY</span>
            <strong>{trace.formationLabel} · {trace.placeLabel}</strong>
            <small>{formatCoordinate(trace.presentLat, "N", "S")} · {formatCoordinate(trace.presentLng, "E", "W")}</small>
          </div>
          <div>
            <span>THEN · RECONSTRUCTED REGION</span>
            <strong>95 Ma · {trace.formationLabel}</strong>
            <small>{formatCoordinate(trace.paleoLat, "N", "S")} · {formatCoordinate(trace.paleoLng, "E", "W")}</small>
          </div>
        </div>
      )}

      {ancient ? (
        <>
          <p className="fossil-info-panel__summary">{life.description}</p>
          <div className="fossil-ecosystem-note">
            <span>RECORDED ENVIRONMENT</span>
            <strong>{life.environment}</strong>
            <small>{life.occurrenceCount.toLocaleString()} PBDB occurrence {life.occurrenceCount === 1 ? "record" : "records"} in this selection · not an abundance estimate</small>
          </div>
          <p className="fossil-evidence-source">
            <span>DATA SOURCE</span>
            <a href={life.sourceUrl} target="_blank" rel="noreferrer">{life.sourceLabel}</a>
            <small>{life.coordinateNote}</small>
          </p>
          {life.featured && <button type="button" className="fossil-panel-action" onClick={onSeeFossilsToday}>SEE FOSSILS TODAY</button>}
        </>
      ) : (
        <>
          <p className="fossil-info-panel__summary">{trace.description}</p>
          <div className="fossil-ecosystem-note">
            <span>PBDB RECORD SUMMARY</span>
            <strong>{trace.siteCount.toLocaleString()} sites · {trace.occurrenceCount.toLocaleString()} occurrences</strong>
            <small>Counts describe records in this prototype selection, not the abundance of ancient life.</small>
          </div>
          <p className="fossil-evidence-source">
            <span>DATA SOURCE</span>
            <a href={trace.sourceUrl} target="_blank" rel="noreferrer">{trace.sourceLabel}</a>
            <small>{trace.coordinateNote}</small>
          </p>
          <p className="fossil-callout">Present shows quiet traces where the rocks are found today. Return to 95 Ma to see the living region on the reconstructed Earth.</p>
          <button type="button" className="fossil-panel-action fossil-panel-action--quiet" onClick={onBackToAncient}>BACK TO 95 MA</button>
        </>
      )}
    </aside>
  );
}

function formatCoordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(1)}°${value >= 0 ? positive : negative}`;
}
