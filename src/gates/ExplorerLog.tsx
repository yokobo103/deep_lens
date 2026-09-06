import { useEffect } from "react";
import { createPortal } from "react-dom";
import { bandById, gateById, gateDefinitions } from "../data/gates";
import { sceneSource } from "./scenes";
import { agePhrase, eraOf, formatDay, type Visit } from "./log";
import { hubCopy, type Locale } from "./copy";

interface ExplorerLogProps {
  visits: readonly Visit[];
  /** Median age of each gate, from the bake. Keyed by gate id. */
  ages: ReadonlyMap<string, number>;
  locale: Locale;
  onGoTo: (gateId: string) => void;
  onClose: () => void;
}

/**
 * Where this reader has been.
 *
 * Two dates on every card, and they are the whole point: the day someone sat
 * down and went, and how far back they went. A log is the only place in the app
 * those two can stand next to each other.
 *
 * Not a mission list. No progress bar, no badges earned, no percentage — the
 * count is here because a reader wants to know how much of it they have seen,
 * and that is a different question from being told to finish.
 *
 * A full screen opened from the header rather than a tab. Deep Lens is one
 * globe; permanent navigation furniture would take a strip off it forever, and
 * on a phone that strip is the difference between holding the Earth and looking
 * at a website about the Earth.
 */
export function ExplorerLog({ visits, ages, locale, onGoTo, onClose }: ExplorerLogProps) {
  const text = hubCopy[locale];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Most recent first: a log is read backwards from the last trip.
  const entries = [...visits]
    .sort((a, b) => (a.on === b.on ? 0 : a.on < b.on ? 1 : -1))
    .flatMap((visit) => {
      const gate = gateById(visit.gateId);
      return gate ? [{ visit, gate }] : [];
    });

  return createPortal(
    <div className="log" role="dialog" aria-modal="true" aria-label={text.logTitle}>
      <div className="log__sheet">
        <header className="log__head">
          <div>
            <p className="log__brand">DEEP LENS</p>
            <h2>{text.logTitle}</h2>
            <p className="log__lede">{text.logLede}</p>
          </div>
          <button type="button" className="log__close" onClick={onClose} aria-label={text.close}>×</button>
        </header>

        <p className="log__count">
          <span>{text.logVisited}</span>
          <b>{entries.length}</b>
          <i>/ {gateDefinitions.length}</i>
        </p>

        {entries.length === 0 && <p className="log__empty">{text.logEmpty}</p>}

        <ol className="log__list">
          {entries.map(({ visit, gate }) => {
            const band = bandById(gate.band);
            const scene = sceneSource(gate.id);
            const ma = ages.get(gate.id);
            return (
              <li key={gate.id}>
                <button type="button" onClick={() => onGoTo(gate.id)}>
                  {scene && <img src={scene} alt="" className="log__scene" />}
                  <span className="log__body">
                    <time dateTime={visit.on}>{formatDay(visit.on)}</time>
                    <strong>{band ? eraOf(band.label[locale]) : gate.name[locale]}</strong>
                    <span className="log__place">{gate.name[locale]}</span>
                    <span className="log__age">{ma === undefined ? "" : agePhrase(ma, locale)}</span>
                  </span>
                  {band && <span className="log__seal" aria-hidden="true">{eraOf(band.label.en).toUpperCase()}</span>}
                </button>
              </li>
            );
          })}
        </ol>

        <p className="log__tail">{text.logMore}</p>
      </div>
    </div>,
    document.body,
  );
}
