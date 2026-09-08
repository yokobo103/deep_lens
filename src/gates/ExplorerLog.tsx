import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  bandById,
  currentRegionDefinitions,
  gateById,
  type GateDefinition,
} from "../data/gates";
import { sceneSource } from "./scenes";
import { agePhrase, eraOf, formatDay, type Visit } from "./log";
import { hubCopy, type Locale } from "./copy";

interface ExplorerLogProps {
  visits: readonly Visit[];
  /** Median age of each gate, from the bake. Keyed by gate id. */
  ages: ReadonlyMap<string, number>;
  locale: Locale;
  onGoTo: (gateId: string) => void;
  onReset: () => void;
  onClose: () => void;
}

type SortMode = "visited" | "oldest" | "newest" | "region";

interface LogEntry {
  visit: Visit;
  gate: GateDefinition;
  ageMa: number;
  visitIndex: number;
}

function fallbackAge(gate: GateDefinition): number {
  return (gate.ageMa.from + gate.ageMa.to) / 2;
}

function ageThenName(direction: "oldest" | "newest", locale: Locale) {
  const sign = direction === "oldest" ? -1 : 1;
  return (a: LogEntry, b: LogEntry) =>
    ((a.ageMa - b.ageMa) * sign)
    || a.gate.name[locale].localeCompare(b.gate.name[locale], locale);
}

/**
 * The quiet room after the globe: one journey, rearranged to reveal time and
 * place. It is an album, not a checklist — there is deliberately no total,
 * percentage, progress bar, or locked slot.
 */
export function ExplorerLog({ visits, ages, locale, onGoTo, onReset, onClose }: ExplorerLogProps) {
  const text = hubCopy[locale];
  const [sortMode, setSortMode] = useState<SortMode>("visited");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const resetConfirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (resetConfirmOpen) setResetConfirmOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, resetConfirmOpen]);

  useEffect(() => {
    if (resetConfirmOpen) resetConfirmRef.current?.querySelector("button")?.focus();
  }, [resetConfirmOpen]);

  const entries = useMemo(() => visits.flatMap((visit, visitIndex) => {
    const gate = gateById(visit.gateId);
    return gate ? [{
      visit,
      gate,
      ageMa: ages.get(gate.id) ?? fallbackAge(gate),
      visitIndex,
    }] : [];
  }), [ages, visits]);

  const sections = useMemo(() => {
    if (sortMode === "region") {
      return currentRegionDefinitions.flatMap((region) => {
        const regionEntries = entries
          .filter((entry) => entry.gate.currentRegion === region.id)
          .sort(ageThenName("oldest", locale));
        return regionEntries.length > 0 ? [{ id: region.id, region, entries: regionEntries }] : [];
      });
    }

    const sorted = [...entries];
    if (sortMode === "visited") {
      sorted.sort((a, b) => b.visit.on.localeCompare(a.visit.on) || b.visitIndex - a.visitIndex);
    } else {
      sorted.sort(ageThenName(sortMode, locale));
    }
    return [{ id: sortMode, region: null, entries: sorted }];
  }, [entries, locale, sortMode]);

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

        <div className="log__tools">
          <p className="log__count">{text.logVisited(entries.length)}</p>
          <label className="log__sort">
            <span>{text.logSort}</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="visited">{text.logSortVisited}</option>
              <option value="oldest">{text.logSortOldest}</option>
              <option value="newest">{text.logSortNewest}</option>
              <option value="region">{text.logSortRegion}</option>
            </select>
          </label>
        </div>

        {entries.length === 0 && <p className="log__empty">{text.logEmpty}</p>}

        <div className="log__album">
          {sections.map((section) => (
            <section className="log__section" key={section.id}>
              {section.region && (
                <header className="log__region">
                  <h3><span aria-hidden="true">⌖</span>{section.region.name[locale]}</h3>
                  <p>{text.logWorlds(section.entries.length)}</p>
                </header>
              )}
              <ol className="log__list">
                {section.entries.map(({ visit, gate, ageMa }) => {
                  const band = bandById(gate.band);
                  const scene = sceneSource(gate.id);
                  return (
                    <li key={gate.id}>
                      <button type="button" onClick={() => onGoTo(gate.id)}>
                        <span className="log__visual">
                          {scene && <img src={scene} alt="" className="log__scene" />}
                          {band && <span className="log__era">{eraOf(band.label[locale])}</span>}
                        </span>
                        <span className="log__body">
                          {sortMode === "visited" && <time dateTime={visit.on}>{formatDay(visit.on)}</time>}
                          <strong>{gate.name[locale]}</strong>
                          <span className="log__place">{gate.place[locale]}</span>
                          <span className="log__age">{agePhrase(ageMa, locale)}</span>
                        </span>
                        <span className="log__return" aria-hidden="true">↗</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>

        {entries.length > 0 && (
          <footer className="log__end">
            <p className="log__tail">{text.logMore}</p>
            <button type="button" className="log__restart" onClick={() => setResetConfirmOpen(true)}>
              {text.logRestart}
            </button>
          </footer>
        )}
      </div>

      {resetConfirmOpen && (
        <div className="log-reset">
          <button type="button" className="log-reset__scrim" aria-label={text.logResetCancel} onClick={() => setResetConfirmOpen(false)} />
          <div
            ref={resetConfirmRef}
            className="log-reset__panel"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="log-reset-title"
            aria-describedby="log-reset-body"
          >
            <h3 id="log-reset-title">{text.logResetTitle}</h3>
            <p id="log-reset-body">{text.logResetBody}</p>
            <div className="log-reset__actions">
              <button type="button" onClick={() => setResetConfirmOpen(false)}>{text.logResetCancel}</button>
              <button
                type="button"
                className="is-destructive"
                onClick={() => { onReset(); setResetConfirmOpen(false); }}
              >
                {text.logResetConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
