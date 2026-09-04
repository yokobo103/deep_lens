import { useCallback, useState } from "react";
import { FossilGlobe } from "../components/FossilGlobe";
import { FossilInfoPanel } from "../components/FossilInfoPanel";
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

  const pickLocation = useCallback((lat: number, lng: number) => {
    setPlace({ lat, lng });
    setSelected(false);
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
  };

  const seeFossilsToday = () => {
    setMode("present");
    setSelected(true);
    setFocusRequest((request) => request + 1);
  };

  const backToAncient = () => {
    setMode("ancient");
    setSelected(false);
    setPlace(null);
    setFocusRequest((request) => request + 1);
  };

  const zoomLabel = zoomLevel === 1 ? "WORLD VIEW" : zoomLevel === 2 ? "REGION VIEW" : "SPECIES VIEW";
  const isAncient = mode === "ancient";

  return (
    <main className={`fossil-poc fossil-poc--${mode}`}>
      <FossilGlobe
        record={record}
        mode={mode}
        focusRequest={focusRequest}
        onSelect={() => setSelected(true)}
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
          <span>95 MA · NORTH AFRICA</span>
          <strong>{mode === "present" ? "FOLLOW THE FOSSIL" : "EXPLORE THE LIVING EARTH"}</strong>
        </div>
      </header>

      <section className="fossil-intro" aria-label="Prototype concept">
        {isAncient ? (
          <>
            <p className="fossil-eyebrow">ANCIENT EARTH · 95 MA</p>
            <h2>Who lived here — <em>then</em>?</h2>
            <p>Every dot is a place someone dug up fossils, drawn where it sat at the time.</p>
          </>
        ) : (
          <>
            <p className="fossil-eyebrow">PRESENT EARTH</p>
            <h2>Pick a place — <em>go down</em></h2>
            <p>Click anywhere on Earth to stack the fossil-bearing layers recorded beneath it.</p>
          </>
        )}
      </section>

      <div className="fossil-mode-dock">
        <span className="fossil-dock-label">TIME MODE</span>
        <TimeModeToggle mode={mode} onChange={changeMode} />
        <span className="fossil-dock-status">{mode === "present" ? "PRESENT · PICK A PLACE" : `95 MA · ${zoomLabel}`}</span>
      </div>

      {selected && <FossilInfoPanel record={record} mode={mode} life={featuredAncientLife} onClose={() => setSelected(false)} onSeeFossilsToday={seeFossilsToday} onBackToAncient={backToAncient} />}
      {!selected && !place && mode === "present" && <button type="button" className="fossil-reopen" onClick={() => setSelected(true)}>SHOW INFO · {record.taxon}</button>}

      {place && (
        <StrataColumn
          lat={place.lat}
          lng={place.lng}
          radiusKm={COLUMN_RADIUS_KM}
          bands={bands}
          loading={columnLoading}
          onClose={() => setPlace(null)}
        />
      )}

      {isAncient ? (
        <div className="fossil-legend fossil-legend--env" aria-label="Environment legend">
          <span className="fossil-legend__title">RECORDED ENVIRONMENT</span>
          {ENV_ORDER.map((env) => (
            <span key={env}>
              <i className="fossil-legend__dot" style={{ background: ENV_COLOR[env] }} aria-hidden="true" />
              {ENV_LABEL[env]}
            </span>
          ))}
          {siteCount > 0 && <small>{siteCount.toLocaleString()} sites · Cenomanian · PBDB</small>}
        </div>
      ) : (
        <div className="fossil-legend" aria-label="Marker legend">
          <span><i className="fossil-legend__bone">🦴</i>Fossil discovery site</span>
        </div>
      )}

      {mode === "present" && <button type="button" className="fossil-back-ancient" onClick={backToAncient}>BACK TO 95 MA</button>}
    </main>
  );
}
