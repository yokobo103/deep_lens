import type { FossilRecord } from "../data/fossils";
import type { AncientLifeRecord } from "../data/ancientLife";
import type { FossilTimeMode } from "./TimeModeToggle";

interface FossilInfoPanelProps {
  record: FossilRecord;
  mode: FossilTimeMode;
  life: AncientLifeRecord;
  onClose: () => void;
  onSeeFossilsToday: () => void;
  onBackToAncient: () => void;
}

export function FossilInfoPanel({ record, mode, life, onClose, onSeeFossilsToday, onBackToAncient }: FossilInfoPanelProps) {
  const ancient = mode === "ancient";

  return (
    <aside className="fossil-info-panel" aria-label={`${record.taxon} information`}>
      <button type="button" className="fossil-info-panel__close" onClick={onClose} aria-label="Close information">×</button>
      <p className="fossil-eyebrow">{ancient ? "ANCIENT LIFE · 95 MA" : "FOSSIL DISCOVERY · PRESENT"}</p>
      <div className="fossil-info-panel__title-row">
        <span className="fossil-info-panel__species-mark" aria-hidden="true">{ancient ? "🦕" : "🦴"}</span>
        <div>
          <h2>{record.taxon}</h2>
          <p>{record.periodLabel} · {record.ageLabel}</p>
        </div>
      </div>

      <div className="fossil-location-compare">
        <div className={!ancient ? "is-current" : ""}>
          <span>NOW · DISCOVERY</span>
          <strong>{record.presentPlaceLabel}</strong>
          <small>{record.presentLat.toFixed(1)}°N · {Math.abs(record.presentLng).toFixed(1)}°W</small>
        </div>
        <div className={ancient ? "is-current" : ""}>
          <span>THEN · LAND POSITION</span>
          <strong>{record.paleoPlaceLabel}</strong>
          <small>{record.paleoLat.toFixed(1)}°N · {Math.abs(record.paleoLng).toFixed(1)}°W</small>
        </div>
      </div>

      {ancient ? (
        <>
          <p className="fossil-info-panel__summary">{life.description}</p>
          <div className="fossil-ecosystem-note">
            <span>WORLD AROUND IT</span>
            <strong>{life.environment}</strong>
            <small>Spinosaurus · crocodilians · large fish · pterosaurs · plant life</small>
          </div>
          <p className="fossil-callout">This is a living-place view: explore the reconstructed land first, then follow the trace back to the fossil site.</p>
          <button type="button" className="fossil-panel-action" onClick={onSeeFossilsToday}>SEE FOSSILS TODAY</button>
        </>
      ) : (
        <>
          <p className="fossil-info-panel__summary">{record.summary}</p>
          <p className="fossil-callout">Present shows the bone at its modern discovery point. The ancient life markers are hidden in this quieter fossil view.</p>
          <button type="button" className="fossil-panel-action fossil-panel-action--quiet" onClick={onBackToAncient}>BACK TO 95 MA</button>
        </>
      )}
    </aside>
  );
}
