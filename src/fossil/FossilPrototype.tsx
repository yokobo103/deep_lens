import { useState } from "react";
import { FossilGlobe } from "../components/FossilGlobe";
import { FossilInfoPanel } from "../components/FossilInfoPanel";
import { TimeModeToggle, type FossilTimeMode } from "../components/TimeModeToggle";
import { featuredAncientLife, type AncientZoomLevel } from "../data/ancientLife";
import { fossilRecords } from "../data/fossils";

export function FossilPrototype() {
  const record = fossilRecords[0];
  const [mode, setMode] = useState<FossilTimeMode>("ancient");
  const [selected, setSelected] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<AncientZoomLevel>(1);
  const [focusRequest, setFocusRequest] = useState(0);

  if (!record || !featuredAncientLife) return null;

  const changeMode = (nextMode: FossilTimeMode) => {
    setMode(nextMode);
    setSelected(false);
  };

  const seeFossilsToday = () => {
    setMode("present");
    setSelected(true);
    setFocusRequest((request) => request + 1);
  };

  const backToAncient = () => {
    setMode("ancient");
    setSelected(false);
    setFocusRequest((request) => request + 1);
  };

  const zoomLabel = zoomLevel === 1 ? "WORLD VIEW" : zoomLevel === 2 ? "REGION VIEW" : "SPECIES VIEW";

  return (
    <main className={`fossil-poc fossil-poc--${mode}`}>
      <FossilGlobe
        record={record}
        mode={mode}
        focusRequest={focusRequest}
        onSelect={() => setSelected(true)}
        onZoomLevelChange={setZoomLevel}
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
        <p className="fossil-eyebrow">ANCIENT EARTH · 95 MA</p>
        <h2>Who lived here — <em>then</em>?</h2>
        <p>Rotate the ancient Earth. Zoom in to let a Cretaceous ecosystem unfold around you.</p>
      </section>

      <div className="fossil-mode-dock">
        <span className="fossil-dock-label">TIME MODE</span>
        <TimeModeToggle mode={mode} onChange={changeMode} />
        <span className="fossil-dock-status">{mode === "present" ? "PRESENT · FOSSIL TRACE" : `95 MA · ${zoomLabel}`}</span>
      </div>

      {selected && <FossilInfoPanel record={record} mode={mode} life={featuredAncientLife} onClose={() => setSelected(false)} onSeeFossilsToday={seeFossilsToday} onBackToAncient={backToAncient} />}
      {!selected && mode === "present" && <button type="button" className="fossil-reopen" onClick={() => setSelected(true)}>SHOW INFO · {record.taxon}</button>}

      <div className="fossil-legend" aria-label="Marker legend">
        {mode === "present"
          ? <span><i className="fossil-legend__bone">🦴</i>Fossil discovery site</span>
          : <span><i className="fossil-legend__life">✣</i>Zoom to reveal life</span>}
      </div>

      {mode === "present" && <button type="button" className="fossil-back-ancient" onClick={backToAncient}>BACK TO 95 MA</button>}
    </main>
  );
}
