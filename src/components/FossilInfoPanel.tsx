import { useEffect, useId, useState } from "react";
import type { FossilRecord } from "../data/fossils";
import type { AncientLifeRecord } from "../data/ancientLife";
import type { PresentTraceRecord } from "../data/presentTraces";
import type { FossilTimeMode } from "./TimeModeToggle";
import { LifeIcon } from "./LifeIcon";
import { fossilCopy, localizeLife, localizeTrace, type Locale } from "../fossil/localization";

interface FossilInfoPanelProps {
  record: FossilRecord;
  mode: FossilTimeMode;
  locale: Locale;
  life: AncientLifeRecord;
  trace: PresentTraceRecord;
  onClose: () => void;
  onSeeFossilsToday: () => void;
  onBackToAncient: () => void;
}

export function FossilInfoPanel({ record, mode, locale, life, trace, onClose, onSeeFossilsToday, onBackToAncient }: FossilInfoPanelProps) {
  const isMobile = useMobileLayout();
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const detailId = useId();
  const ancient = mode === "ancient";
  const copy = fossilCopy[locale];
  const lifeText = localizeLife(life, locale);
  const traceText = localizeTrace(trace, locale);
  const selectedTaxon = life.recordType === "taxon" && life.regionId === trace.regionId;
  const taxonSpecificTrace = life.id === "spinosaurus";
  const title = ancient
    ? lifeText.name
    : selectedTaxon
      ? taxonSpecificTrace
        ? locale === "ja" ? `${lifeText.name}の化石記録` : `${lifeText.name} fossil record`
        : locale === "ja" ? `${lifeText.name}に関連する地域記録` : `Regional record linked to ${lifeText.name}`
      : traceText.name;
  const presentLat = taxonSpecificTrace ? record.presentLat : trace.presentLat;
  const presentLng = taxonSpecificTrace ? record.presentLng : trace.presentLng;
  const paleoLat = taxonSpecificTrace ? record.paleoLat : trace.paleoLat;
  const paleoLng = taxonSpecificTrace ? record.paleoLng : trace.paleoLng;
  const showDetails = !isMobile || mobileExpanded;

  return (
    <aside className={`fossil-info-panel${mobileExpanded ? " is-mobile-expanded" : " is-mobile-collapsed"}`} aria-label={`${title} information`}>
      <button type="button" className="fossil-info-panel__close" onClick={onClose} aria-label={copy.closeInfo}>×</button>
      <button
        type="button"
        className="fossil-info-panel__toggle"
        aria-expanded={showDetails}
        aria-controls={detailId}
        onClick={() => setMobileExpanded((expanded) => !expanded)}
      >
        <span>{mobileExpanded ? copy.hideDetails : copy.showDetails}</span>
        <i aria-hidden="true">⌃</i>
      </button>
      <p className="fossil-eyebrow">{ancient ? `${life.recordType === "ecosystem" ? copy.regionalWorld : copy.ancientLife} · ${locale === "ja" ? "セノマニアン期" : "CENOMANIAN"}` : copy.fossilDiscovery}</p>
      <div className="fossil-info-panel__title-row">
        <span className="fossil-info-panel__species-mark" aria-hidden="true">{ancient ? <LifeIcon iconType={life.iconType} /> : "🦴"}</span>
        <div>
          <h2>{title}</h2>
          <p>{ancient ? `${lifeText.regionLabel} · ${lifeText.category}` : `${traceText.placeLabel} · ${record.ageLabel}${locale === "ja" ? "の岩石" : " rocks"}`}</p>
        </div>
      </div>

      {showDetails && <div id={detailId} className="fossil-info-panel__details">
      {ancient ? (
        <div className="fossil-location-compare">
          <div className="is-current">
            <span>{copy.reconstructedPlace}</span>
            <strong>{lifeText.regionLabel}</strong>
            <small>{formatCoordinate(life.lat, "N", "S")} · {formatCoordinate(life.lng, "E", "W")}</small>
          </div>
          <div>
            <span>{copy.rockRecord}</span>
            <strong>{lifeText.formationLabel}</strong>
            <small>{copy.cenomanianWindow}</small>
          </div>
        </div>
      ) : (
        <div className="fossil-location-compare">
          <div className="is-current">
            <span>{copy.nowDiscovery}</span>
            <strong>{traceText.formationLabel} · {traceText.placeLabel}</strong>
            <small>{formatCoordinate(presentLat, "N", "S")} · {formatCoordinate(presentLng, "E", "W")}</small>
          </div>
          <div>
            <span>{copy.thenRegion}</span>
            <strong>95 Ma · {traceText.formationLabel}</strong>
            <small>{formatCoordinate(paleoLat, "N", "S")} · {formatCoordinate(paleoLng, "E", "W")}</small>
          </div>
        </div>
      )}

      {ancient ? (
        <>
          <p className="fossil-info-panel__summary">{lifeText.description}</p>
          <div className="fossil-ecosystem-note">
            <span>{copy.recordedEnvironmentPanel}</span>
            <strong>{lifeText.environment}</strong>
            <small>{copy.occurrenceSummary(life.occurrenceCount)}</small>
          </div>
          <p className="fossil-evidence-source">
            <span>{copy.dataSource}</span>
            <a href={life.sourceUrl} target="_blank" rel="noreferrer">{lifeText.sourceLabel}</a>
            <small>{lifeText.coordinateNote}</small>
          </p>
          <button type="button" className="fossil-panel-action" onClick={onSeeFossilsToday}>{copy.seeFossilsToday}</button>
        </>
      ) : (
        <>
          <p className="fossil-info-panel__summary">{taxonSpecificTrace ? locale === "ja" ? "Spinosaurus aegyptiacusは、現在のモロッコに露出するセノマニアン期のケムケム層群から記録されています。" : record.summary : traceText.description}</p>
          <div className="fossil-ecosystem-note">
            <span>{copy.pbdbSummary}</span>
            <strong>{taxonSpecificTrace ? locale === "ja" ? "Spinosaurusの記録 17件" : "17 Spinosaurus occurrence records" : copy.sitesAndOccurrences(trace.siteCount, trace.occurrenceCount)}</strong>
            <small>{copy.recordCountNote}</small>
          </div>
          <p className="fossil-evidence-source">
            <span>{copy.dataSource}</span>
            <a href={taxonSpecificTrace ? record.sourceUrl : trace.sourceUrl} target="_blank" rel="noreferrer">{taxonSpecificTrace ? locale === "ja" ? "古生物学データベース · Spinosaurus記録" : record.sourceLabel : traceText.sourceLabel}</a>
            <small>{taxonSpecificTrace ? locale === "ja" ? "現代座標はSpinosaurus aegyptiacusの記録地点、古座標はPBDB PALEOMAP（Scotese）の17件の中心です。" : record.coordinateNote : traceText.coordinateNote}</small>
          </p>
          <p className="fossil-callout">{copy.presentCallout}</p>
          <button type="button" className="fossil-panel-action fossil-panel-action--quiet" onClick={onBackToAncient}>{copy.backToAncient}</button>
        </>
      )}
      </div>}
    </aside>
  );
}

function useMobileLayout() {
  const query = "(max-width: 820px)";
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return matches;
}

function formatCoordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(1)}°${value >= 0 ? positive : negative}`;
}
