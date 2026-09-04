import { useCallback, useState } from "react";
import { FossilGlobe } from "../components/FossilGlobe";
import { FossilInfoPanel } from "../components/FossilInfoPanel";
import { PlaceContextPanel } from "../components/PlaceContextPanel";
import { StrataColumn } from "../components/StrataColumn";
import { TimeModeToggle, type FossilTimeMode } from "../components/TimeModeToggle";
import { featuredAncientLife, type AncientZoomLevel } from "../data/ancientLife";
import { fossilRecords } from "../data/fossils";
import { buildColumn, loadFormations, ENV_COLOR, ENV_LABEL, ENV_ORDER, type ColumnBand } from "../data/pbdb";

/** How far from the clicked point a formation still counts as "here". */
const COLUMN_RADIUS_KM = 200;

interface PickedPlace {
  lat: number;
  lng: number;
}

export function FossilPrototype() {
  const record = fossilRecords[0];
  const [mode, setMode] = useState<FossilTimeMode>("ancient");
  const [selected, setSelected] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<AncientZoomLevel>(1);
  const [focusRequest, setFocusRequest] = useState(0);
  const [siteCount, setSiteCount] = useState(0);
  const [place, setPlace] = useState<PickedPlace | null>(null);
  const [bands, setBands] = useState<ColumnBand[]>([]);
  const [columnLoading, setColumnLoading] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showStrata, setShowStrata] = useState(false);

  const pickLocation = useCallback((lat: number, lng: number) => {
    setPlace({ lat, lng });
    setSelected(false);
    setShowStrata(false);
    setColumnLoading(true);
    loadFormations()
      .then(({ formations }) => setBands(buildColumn(formations, lat, lng, COLUMN_RADIUS_KM)))
      .catch((error: unknown) => {
        console.warn("Formations could not be loaded", error);
        setBands([]);
      })
      .finally(() => setColumnLoading(false));
  }, []);

  if (!record || !featuredAncientLife) return null;

  const changeMode = (nextMode: FossilTimeMode) => {
    setMode(nextMode);
    setSelected(false);
    setPlace(null);
    setShowStrata(false);
  };

  const seeFossilsToday = () => {
    setMode("present");
    setSelected(true);
    setPlace(null);
    setShowStrata(false);
    setFocusRequest((request) => request + 1);
  };

  const backToAncient = () => {
    setMode("ancient");
    setSelected(false);
    setPlace(null);
    setShowStrata(false);
    setFocusRequest((request) => request + 1);
  };

  const zoomLabel = zoomLevel === 1 ? "WORLD VIEW" : zoomLevel === 2 ? "REGION VIEW" : "SPECIES VIEW";
  const isAncient = mode === "ancient";

  return (
    <main className={`fossil-poc fossil-poc--${mode}`}>
      <FossilGlobe
        record={record}
        mode={mode}
        showEvidence={showEvidence}
        focusRequest={focusRequest}
        onSelect={() => {
          setSelected(true);
          setPlace(null);
          setShowStrata(false);
        }}
        onZoomLevelChange={setZoomLevel}
        onPickLocation={pickLocation}
        onSitesLoaded={setSiteCount}
      />

      <header className="fossil-header">
        <div className="fossil-brand">
          <span className="fossil-brand__mark" aria-hidden="true">◌</span>
          <div>
            <p>DEEP LENS</p>
            <h1>ANCIENT LIFE MAP</h1>
          </div>
        </div>
        <div className="fossil-header__readout">
          <span>{isAncient ? "95 MA · NORTH AFRICA" : "PRESENT · FOSSIL TRACE"}</span>
          <strong>{mode === "present" ? "FOLLOW THE FOSSIL" : "EXPLORE THE LIVING EARTH"}</strong>
        </div>
      </header>

      <section className="fossil-intro" aria-label="Prototype concept">
        {isAncient ? (
          <>
            <p className="fossil-eyebrow">ANCIENT EARTH · 95 MA</p>
            <h2>Who lived here — <em>then</em>?</h2>
            <p>Turn the globe. Zoom until a Cretaceous ecosystem begins to appear.</p>
          </>
        ) : (
          <>
            <p className="fossil-eyebrow">PRESENT EARTH</p>
            <h2>Find what remains — <em>now</em></h2>
            <p>Choose a fossil trace, or tap the Earth to inspect the evidence beneath a place.</p>
          </>
        )}
      </section>

      {!selected && !place && (
        <section className="fossil-axis-strip" aria-label="Current exploration axes">
          <div><span>PLACE</span><strong>{isAncient ? "North Africa" : "Morocco"}</strong></div>
          <div><span>TIME</span><strong>{isAncient ? "95 Ma" : "Present"}</strong></div>
          <div><span>LIFE</span><strong>{isAncient ? "Ecosystem" : "Fossil trace"}</strong></div>
          <div><span>ENVIRONMENT</span><strong>{isAncient ? "Rivers · lagoons" : "Recorded layers"}</strong></div>
        </section>
      )}

      <div className="fossil-mode-dock">
        <span className="fossil-dock-label">TIME MODE</span>
        <TimeModeToggle mode={mode} onChange={changeMode} />
        <span className="fossil-dock-status">{mode === "present" ? "PRESENT · PICK A PLACE" : `95 MA · ${zoomLabel}`}</span>
      </div>

      {selected && <FossilInfoPanel record={record} mode={mode} life={featuredAncientLife} onClose={() => setSelected(false)} onSeeFossilsToday={seeFossilsToday} onBackToAncient={backToAncient} />}
      {!selected && !place && mode === "present" && <button type="button" className="fossil-reopen" onClick={() => setSelected(true)}>SHOW INFO · {record.taxon}</button>}

      {place && !showStrata && (
        <PlaceContextPanel
          lat={place.lat}
          lng={place.lng}
          bands={bands}
          loading={columnLoading}
          onClose={() => {
            setPlace(null);
            setShowStrata(false);
          }}
          onOpenEvidence={() => setShowStrata(true)}
        />
      )}

      {place && showStrata && (
        <StrataColumn
          lat={place.lat}
          lng={place.lng}
          radiusKm={COLUMN_RADIUS_KM}
          bands={bands}
          loading={columnLoading}
          onClose={() => setShowStrata(false)}
        />
      )}

      {isAncient && !selected && (
        <button
          type="button"
          className="fossil-evidence-toggle"
          aria-pressed={showEvidence}
          onClick={() => setShowEvidence((visible) => !visible)}
        >
          <span>{showEvidence ? "EVIDENCE LAYER · ON" : "OPTIONAL EVIDENCE"}</span>
          <strong>{showEvidence ? "HIDE PBDB DOTS" : "SHOW PBDB DOTS"}</strong>
          <small>{showEvidence && siteCount > 0 ? `${siteCount.toLocaleString()} fossil sites · zoom in` : "Life stays in the foreground"}</small>
        </button>
      )}

      {isAncient && showEvidence && !selected ? (
        <div className="fossil-legend fossil-legend--env fossil-legend--evidence" aria-label="Environment legend">
          <span className="fossil-legend__title">RECORDED ENVIRONMENT</span>
          {ENV_ORDER.map((env) => (
            <span key={env}>
              <i className="fossil-legend__dot" style={{ background: ENV_COLOR[env] }} aria-hidden="true" />
              {ENV_LABEL[env]}
            </span>
          ))}
        </div>
      ) : !isAncient ? (
        <div className="fossil-legend" aria-label="Marker legend">
          <span><i className="fossil-legend__bone">🦴</i>Fossil discovery site</span>
        </div>
      ) : null}

      {mode === "present" && <button type="button" className="fossil-back-ancient" onClick={backToAncient}>BACK TO 95 MA</button>}
    </main>
  );
}
