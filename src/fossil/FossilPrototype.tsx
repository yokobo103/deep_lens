import { useCallback, useEffect, useState } from "react";
import { FossilGlobe } from "../components/FossilGlobe";
import { FossilInfoPanel } from "../components/FossilInfoPanel";
import { PlaceContextPanel } from "../components/PlaceContextPanel";
import { StrataColumn } from "../components/StrataColumn";
import { TimeModeToggle, type FossilTimeMode } from "../components/TimeModeToggle";
import { ancientLifeRecords, featuredAncientLife, type AncientLifeRecord, type AncientZoomLevel } from "../data/ancientLife";
import { fossilRecords } from "../data/fossils";
import { featuredPresentTrace, presentTraceRecords, type PresentTraceRecord } from "../data/presentTraces";
import { buildColumn, loadFormations, ENV_COLOR, ENV_LABEL, ENV_ORDER, type ColumnBand } from "../data/pbdb";
import { environmentLabel, fossilCopy, type Locale } from "./localization";

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
  const [selectedLife, setSelectedLife] = useState<AncientLifeRecord | null>(featuredAncientLife ?? null);
  const [selectedTrace, setSelectedTrace] = useState<PresentTraceRecord | null>(featuredPresentTrace ?? null);
  const [zoomLevel, setZoomLevel] = useState<AncientZoomLevel>(1);
  const [focusRequest, setFocusRequest] = useState(0);
  const [siteCount, setSiteCount] = useState(0);
  const [place, setPlace] = useState<PickedPlace | null>(null);
  const [bands, setBands] = useState<ColumnBand[]>([]);
  const [columnLoading, setColumnLoading] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showStrata, setShowStrata] = useState(false);
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      return window.localStorage.getItem("deep-lens-locale") === "en" ? "en" : "ja";
    } catch {
      return "ja";
    }
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem("deep-lens-locale", locale);
    } catch {
      // The language still works when storage is unavailable.
    }
  }, [locale]);

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

  if (!record || !featuredAncientLife || !featuredPresentTrace) return null;
  const copy = fossilCopy[locale];

  const changeMode = (nextMode: FossilTimeMode) => {
    if (nextMode === mode) return;
    if (selected) {
      if (nextMode === "present" && selectedLife) {
        setSelectedTrace(presentTraceRecords.find((trace) => trace.regionId === selectedLife.regionId) ?? featuredPresentTrace);
      }
      if (nextMode === "ancient" && selectedTrace && selectedLife?.regionId !== selectedTrace.regionId) {
        setSelectedLife(findRegionEcosystem(selectedTrace.regionId) ?? featuredAncientLife);
      }
      setFocusRequest((request) => request + 1);
    }
    setMode(nextMode);
    setPlace(null);
    setShowStrata(false);
  };

  const seeFossilsToday = () => {
    const matchingTrace = presentTraceRecords.find((trace) => trace.regionId === selectedLife?.regionId) ?? featuredPresentTrace;
    setMode("present");
    setSelected(true);
    setSelectedTrace(matchingTrace);
    setPlace(null);
    setShowStrata(false);
    setFocusRequest((request) => request + 1);
  };

  const backToAncient = () => {
    setMode("ancient");
    setSelected(true);
    setPlace(null);
    setShowStrata(false);
    setFocusRequest((request) => request + 1);
  };

  const zoomLabel = zoomLevel === 1 ? copy.worldView : zoomLevel === 2 ? copy.regionView : copy.speciesView;
  const isAncient = mode === "ancient";

  return (
    <main className={`fossil-poc fossil-poc--${mode}`}>
      <FossilGlobe
        record={record}
        mode={mode}
        locale={locale}
        showEvidence={showEvidence}
        focusLife={selected ? selectedLife : null}
        focusTrace={selected ? selectedTrace : null}
        focusRequest={focusRequest}
        onSelectTrace={(trace) => {
          setSelected(true);
          setSelectedTrace(trace);
          setSelectedLife(findRegionEcosystem(trace.regionId) ?? featuredAncientLife);
          setPlace(null);
          setShowStrata(false);
        }}
        onSelectLife={(life) => {
          setSelected(true);
          setSelectedLife(life);
          setSelectedTrace(presentTraceRecords.find((trace) => trace.regionId === life.regionId) ?? featuredPresentTrace);
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
            <h1>{locale === "ja" ? "古代生命マップ" : "ANCIENT LIFE MAP"}</h1>
          </div>
        </div>
        <div className="fossil-header__readout">
          <span>{isAncient ? copy.fourAncientRegions : copy.fourPresentTraces}</span>
          <strong>{mode === "present" ? copy.followFossil : copy.exploreLivingEarth}</strong>
        </div>
        <nav className="fossil-language-toggle" aria-label={copy.language}>
          <button type="button" aria-pressed={locale === "ja"} onClick={() => setLocale("ja")}>JA</button>
          <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
        </nav>
      </header>

      <section className="fossil-intro" aria-label={locale === "ja" ? "プロトタイプのコンセプト" : "Prototype concept"}>
        {isAncient ? (
          <>
            <p className="fossil-eyebrow">{copy.ancientEarth}</p>
            <h2>{copy.ancientQuestionBefore} <em>{copy.ancientQuestionEmphasis}</em></h2>
            <p>{copy.ancientIntro}</p>
          </>
        ) : (
          <>
            <p className="fossil-eyebrow">{copy.presentEarth}</p>
            <h2>{copy.presentQuestionBefore} <em>{copy.presentQuestionEmphasis}</em></h2>
            <p>{copy.presentIntro}</p>
          </>
        )}
      </section>

      {!selected && !place && (
        <section className="fossil-axis-strip" aria-label={locale === "ja" ? "現在の探索軸" : "Current exploration axes"}>
          <div><span>{copy.place}</span><strong>{isAncient ? copy.fourRegions : copy.fourTraceRegions}</strong></div>
          <div><span>{copy.time}</span><strong>{isAncient ? "95 Ma" : copy.present}</strong></div>
          <div><span>{copy.life}</span><strong>{isAncient ? copy.regionalBiotas : copy.fossilTraces}</strong></div>
          <div><span>{copy.environment}</span><strong>{isAncient ? copy.environmentsAncient : copy.recordedLayers}</strong></div>
        </section>
      )}

      <div className="fossil-mode-dock">
        <span className="fossil-dock-label">{copy.timeMode}</span>
        <TimeModeToggle mode={mode} locale={locale} onChange={changeMode} />
        <span className="fossil-dock-status">{mode === "present" ? `${copy.present} · ${copy.fourTraceRegions}` : `95 MA · ${zoomLabel}`}</span>
      </div>

      {selected && selectedLife && selectedTrace && <FossilInfoPanel key={`${mode}-${selectedLife.id}-${selectedTrace.id}`} record={record} mode={mode} locale={locale} life={selectedLife} trace={selectedTrace} onClose={() => setSelected(false)} onSeeFossilsToday={seeFossilsToday} onBackToAncient={backToAncient} />}
      {!selected && !place && mode === "present" && <button type="button" className="fossil-reopen" onClick={() => { setSelectedTrace(featuredPresentTrace); setSelectedLife(findRegionEcosystem(featuredPresentTrace.regionId) ?? featuredAncientLife); setSelected(true); }}>{copy.showTraceInfo}</button>}

      {place && !showStrata && (
        <PlaceContextPanel
          lat={place.lat}
          lng={place.lng}
          locale={locale}
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
          locale={locale}
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
          <span>{showEvidence ? copy.evidenceOn : copy.optionalEvidence}</span>
          <strong>{showEvidence ? copy.hidePbdb : copy.showPbdb}</strong>
          <small>{showEvidence && siteCount > 0 ? copy.fossilSitesZoom(siteCount) : copy.evidenceHint}</small>
        </button>
      )}

      {isAncient && showEvidence && !selected ? (
        <div className="fossil-legend fossil-legend--env fossil-legend--evidence" aria-label={copy.recordedEnvironment}>
          <span className="fossil-legend__title">{copy.recordedEnvironment}</span>
          {ENV_ORDER.map((env) => (
            <span key={env}>
              <i className="fossil-legend__dot" style={{ background: ENV_COLOR[env] }} aria-hidden="true" />
              {environmentLabel(locale, ENV_LABEL[env])}
            </span>
          ))}
        </div>
      ) : !isAncient ? (
        <div className="fossil-legend" aria-label={locale === "ja" ? "マーカー凡例" : "Marker legend"}>
          <span><i className="fossil-legend__bone">🦴</i>{copy.modernTraceRegion}</span>
        </div>
      ) : null}

      {mode === "present" && !selected && <button type="button" className="fossil-back-ancient" onClick={backToAncient}>{copy.backToAncient}</button>}
    </main>
  );
}

function findRegionEcosystem(regionId: string) {
  return ancientLifeRecords.find((life) => life.regionId === regionId && life.recordType === "ecosystem");
}
