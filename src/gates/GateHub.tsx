import { useEffect, useMemo, useRef, useState } from "react";
import { GateGlobe } from "./GateGlobe";
import { gateById, gatesInBand, bandById, hubs, hubIdOf, type GateDefinition, type Hub } from "../data/gates";
import { loadGateManifest, loadGate, type GateDetail, type GateSummary } from "../data/gateData";
import { WorldPanel } from "./WorldPanel";
import { hubCopy, type Locale } from "./copy";
import { TimeScale } from "./TimeScale";
import { ExplorerLog } from "./ExplorerLog";
import { About } from "./About";
import { HeaderMenu } from "./HeaderMenu";
import { readLog, recordVisit, resetLog, type Visit } from "./log";
import { dominantEnvironment, type EnvClass } from "../data/environment";
import { Achievements } from "./Achievements";
import { AchievementToast } from "./AchievementToast";
import {
  achievementDefinitions,
  evaluateAchievements,
  type AchievementId,
} from "./AchievementCatalog";

/**
 * The present-day Earth as a hub: gates on it, and nothing else.
 *
 * Everything that used to stand here — species, fossil markers, the age
 * toggle — has gone. At planet scale a region is the smallest thing that can
 * be pointed at without markers landing on top of one another, so the globe
 * carries worlds and the creatures live inside them.
 */
export function GateHub() {
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      return window.localStorage.getItem("deep-lens-locale") === "en" ? "en" : "ja";
    } catch {
      return "ja";
    }
  });
  const [gates, setGates] = useState<GateSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [enteredId, setEnteredId] = useState<string | null>(null);
  const [world, setWorld] = useState<GateDetail | null>(null);
  // The panel can be put away without leaving the age. Arriving anywhere opens
  // it again, because arriving is exactly when there is something to read.
  const [panelOpen, setPanelOpen] = useState(true);
  // Optional, and remembered. The globe and its gates are the thing; this is a
  // reader's thumb held in the book, and some readers do not want one.
  const [visits, setVisits] = useState<Visit[]>(() => readLog());
  const [logOpen, setLogOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const initialVisits = useRef(visits);
  const knownAchievements = useRef<Set<AchievementId>>(new Set());
  const achievementsInitialised = useRef(false);
  const [achievementEvidenceReady, setAchievementEvidenceReady] = useState(false);
  const [achievementEnvironments, setAchievementEnvironments] = useState<Map<string, EnvClass>>(new Map());
  const [achievementQueue, setAchievementQueue] = useState<AchievementId[]>([]);
  const [timescale, setTimescale] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem("deep-lens-timescale") !== "off";
    } catch {
      return true;
    }
  });
  const allHubs = hubs();
  const visitedGateIds = new Set(visits.map((visit) => visit.gateId));

  // The bake's own numbers, so a discovery can ask about paleolatitude or how
  // much record a world holds without those being copied into gates.ts.
  const gateSummaries = useMemo(
    () => new Map(gates.map((gate) => [gate.id, gate])),
    [gates],
  );
  const earnedAchievements = useMemo(
    () => evaluateAchievements({ visits, environments: achievementEnvironments, summaries: gateSummaries }),
    [achievementEnvironments, gateSummaries, visits],
  );
  const earnedAchievementIds = useMemo(
    () => new Set(earnedAchievements.map(({ id }) => id)),
    [earnedAchievements],
  );
  const currentAchievement = achievementDefinitions.find(({ id }) => id === achievementQueue[0]);

  const enterGate = (id: string | null) => {
    setEnteredId(id);
    setWorld(null);
    setPanelOpen(true);
    if (!id) return;
    setVisits((log) => recordVisit(id, log));
    loadGate(id)
      .then((detail) => {
        setWorld((current) => (current?.id === detail.id ? current : detail));
        setAchievementEnvironments((known) => {
          const next = new Map(known);
          next.set(detail.id, dominantEnvironment(detail.environments));
          return next;
        });
      })
      .catch((error: unknown) => console.warn("World could not be loaded", error));
  };

  const restartJourney = () => {
    resetLog();
    setVisits([]);
    setSelectedId(null);
    setEnteredId(null);
    setWorld(null);
    setPanelOpen(true);
    knownAchievements.current.clear();
    setAchievementQueue([]);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem("deep-lens-locale", locale);
    } catch {
      // The language still works when storage is unavailable.
    }
  }, [locale]);

  useEffect(() => {
    try {
      window.localStorage.setItem("deep-lens-timescale", timescale ? "on" : "off");
    } catch {
      // The setting still works for this visit when storage is unavailable.
    }
  }, [timescale]);

  useEffect(() => {
    loadGateManifest()
      .then(({ gates: baked }) => setGates(baked))
      .catch((error: unknown) => console.warn("Gates could not be loaded", error));
  }, []);

  // Existing journeys are evaluated once, including the PBDB environment of
  // every visited world. They become part of the archive without producing a
  // stack of notifications when this feature first appears.
  useEffect(() => {
    let current = true;
    const ids = [...new Set(initialVisits.current.map(({ gateId }) => gateId))];
    Promise.allSettled(ids.map((id) => loadGate(id))).then((results) => {
      if (!current) return;
      setAchievementEnvironments((known) => {
        const next = new Map(known);
        for (const result of results) {
          if (result.status === "fulfilled") {
            next.set(result.value.id, dominantEnvironment(result.value.environments));
          }
        }
        return next;
      });
      setAchievementEvidenceReady(true);
    });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (!achievementEvidenceReady) return;
    if (!achievementsInitialised.current) {
      knownAchievements.current = new Set(earnedAchievementIds);
      achievementsInitialised.current = true;
      return;
    }
    const foundNow = earnedAchievements.filter(({ id }) => !knownAchievements.current.has(id));
    if (foundNow.length === 0) return;
    for (const { id } of foundNow) knownAchievements.current.add(id);
    setAchievementQueue((queue) => [
      ...queue,
      ...foundNow.map(({ id }) => id).filter((id) => !queue.includes(id)),
    ]);
  }, [achievementEvidenceReady, earnedAchievementIds, earnedAchievements]);

  const text = hubCopy[locale];
  const selected = selectedId ? gates.find((gate) => gate.id === selectedId) : undefined;
  const definition = selectedId ? gateById(selectedId) : undefined;
  const selectedHub = definition ? allHubs.find((hub) => hub.id === hubIdOf(definition)) : undefined;

  // A hub stands where its most recent gate stands. The places barely move
  // between a hub's ages — that is what makes them one hub — so the youngest
  // record is simply the best surveyed.
  const entered = enteredId ? gateById(enteredId) : undefined;
  const enteredBand = entered ? bandById(entered.band) : undefined;
  // The other ages of the place being stood in. A hub is the same ground seen
  // at different times, so this is the vertical move — as against the band's
  // markers on the globe, which are the same time seen at different places.
  const enteredHub = entered ? allHubs.find((hub) => hub.id === hubIdOf(entered)) : undefined;
  const alsoHere = (enteredHub?.gates ?? []).filter((gate) => gate.id !== entered?.id);

  // Inside a world the globe carries that Earth's gates at the positions they
  // held then — which is what makes pulling back worth doing.
  const bandPoints = entered
    ? [entered, ...gatesInBand(entered.band, entered.id)].flatMap((gate) => {
        const summary = gates.find((entry) => entry.id === gate.id);
        return summary ? [{ id: gate.id, lat: summary.paleoLat, lng: summary.paleoLng }] : [];
      })
    : [];

  const hubPoints = allHubs.flatMap((hub) => {
    const youngest = [...hub.gates].sort((a, b) => a.ageMa.to - b.ageMa.to)[0];
    const summary = youngest ? gates.find((gate) => gate.id === youngest.id) : undefined;
    // A place holding several ages keeps its name when names collide: it is
    // the one with most behind it.
    return summary ? [{ id: hub.id, lat: summary.lat, lng: summary.lng, weight: hub.gates.length }] : [];
  });

  return (
    <main className="gate-hub">
      <GateGlobe
        ariaLabel={text.globe}
        terrain={enteredBand ? {
          url: `${import.meta.env.BASE_URL}geo/paleodem-${enteredBand.terrainMa}.webp`,
          credit: `Scotese & Wright (2018) PALEOMAP PaleoDEM · ${enteredBand.terrainMa} Ma · 1° grid · CC BY 4.0`,
        } : null}
        focus={world ? { lat: world.paleoLat, lng: world.paleoLng, height: 9_000_000 } : null}
        points={entered ? bandPoints : hubPoints}
        renderPoint={(point) => {
          if (entered) {
            const neighbour = gateById(point.id);
            if (!neighbour) return null;
            const isHere = neighbour.id === entered.id;
            const isDiscovered = visitedGateIds.has(neighbour.id);
            const isRevealed = isHere || isDiscovered;
            return (
              <button
                key={point.id}
                data-globe-point={point.id}
                type="button"
                className={`gate-marker${isHere ? " is-here" : ""}${isDiscovered ? " is-discovered" : " is-undiscovered"}`}
                onClick={() => (isHere ? setPanelOpen(true) : enterGate(neighbour.id))}
                aria-label={isRevealed ? neighbour.name[locale] : text.gateTrace}
              >
                <span className="gate-marker__ring" aria-hidden="true" />
                <span className="gate-marker__core" aria-hidden="true" />
                <span className="gate-marker__label">{isHere ? `${neighbour.name[locale]} · ${text.here}` : neighbour.name[locale]}</span>
              </button>
            );
          }
          const hub = allHubs.find((entry) => entry.id === point.id);
          if (!hub) return null;
          const isSelected = selectedHub?.id === hub.id;
          const isDiscovered = hub.gates.some((gate) => visitedGateIds.has(gate.id));
          const isRevealed = isSelected || isDiscovered;
          return (
            <button
              key={point.id}
              data-globe-point={point.id}
              type="button"
              className={`gate-marker${isSelected ? " is-selected" : ""}${isDiscovered ? " is-discovered" : " is-undiscovered"}${hub.gates.length > 1 && isRevealed ? " has-ages" : ""}`}
              onClick={() => setSelectedId(hub.gates[0]!.id)}
              aria-label={isRevealed ? `${hub.name[locale]} — ${hub.place[locale]}` : text.gateTrace}
            >
              <span className="gate-marker__ring" aria-hidden="true" />
              <span className="gate-marker__core" aria-hidden="true" />
              <span className="gate-marker__label">
                {hub.name[locale]}
                {hub.gates.length > 1 && <i aria-hidden="true">{hub.gates.length}</i>}
              </span>
            </button>
          );
        }}
      />

      <header className="gate-header">
        <p className="gate-wordmark">
          <svg viewBox="0 0 22 22" width="17" height="17" fill="none" aria-hidden="true">
            <path d="M17.5 3.4a9 9 0 1 0 0 15.2A10.6 10.6 0 0 1 17.5 3.4Z" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          DEEP LENS
        </p>

        <div className="gate-controls">
          <nav className="gate-language" aria-label={text.language}>
            <button type="button" aria-pressed={locale === "ja"} onClick={() => setLocale("ja")}>JA</button>
            <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
          </nav>

          <HeaderMenu
            open={menuOpen}
            locale={locale}
            timescale={timescale}
            visits={visits.length}
            atGlobe={!entered && !selected && !logOpen && !achievementsOpen && !aboutOpen}
            onToggle={() => setMenuOpen((wasOpen) => !wasOpen)}
            onClose={() => setMenuOpen(false)}
            onFindGate={() => { setMenuOpen(false); setLogOpen(false); setAchievementsOpen(false); setAboutOpen(false); setSelectedId(null); if (entered) enterGate(null); }}
            onLog={() => { setMenuOpen(false); setAchievementsOpen(false); setAboutOpen(false); setLogOpen(true); }}
            onAchievements={() => { setMenuOpen(false); setLogOpen(false); setAboutOpen(false); setAchievementsOpen(true); }}
            onTimescale={() => setTimescale((on) => !on)}
            onAbout={() => { setMenuOpen(false); setLogOpen(false); setAchievementsOpen(false); setAboutOpen(true); }}
          />
        </div>
      </header>

      {aboutOpen && <About locale={locale} onClose={() => setAboutOpen(false)} />}

      {achievementsOpen && (
        <Achievements
          earnedIds={earnedAchievementIds}
          locale={locale}
          onClose={() => setAchievementsOpen(false)}
        />
      )}

      {logOpen && (
        <ExplorerLog
          visits={visits}
          ages={new Map(gates.flatMap((gate) => (gate.medianAgeMa === null ? [] : [[gate.id, gate.medianAgeMa] as const])))}
          locale={locale}
          onGoTo={(id) => { setLogOpen(false); setSelectedId(null); enterGate(id); }}
          onReset={restartJourney}
          onClose={() => setLogOpen(false)}
        />
      )}

      {currentAchievement && (
        <AchievementToast
          key={currentAchievement.id}
          achievement={currentAchievement}
          locale={locale}
          onDone={() => setAchievementQueue((queue) => queue.slice(1))}
        />
      )}

      {timescale && (
        <TimeScale
          ageMa={enteredBand?.terrainMa ?? null}
          locale={locale}
          label={text.timescaleAt(enteredBand?.label[locale] ?? text.now)}
        />
      )}

      {!selected && !entered && (
        <p className="gate-hint">{text.hint}</p>
      )}

      {!entered && selected && definition && (
        <GateCard
          gate={definition}
          hub={selectedHub}
          summary={selected}
          locale={locale}
          onClose={() => setSelectedId(null)}
          onGoTo={setSelectedId}
          onEnter={() => { enterGate(definition.id); setSelectedId(null); }}
        />
      )}

      {entered && world && panelOpen && (
        <WorldPanel
          key={entered.id}
          gate={entered}
          detail={world}
          locale={locale}
          alsoHere={alsoHere}
          onGoTo={enterGate}
          onDismiss={() => setPanelOpen(false)}
        />
      )}

      {/* The age you are standing in, and the way out of it. Leaving is a
          property of the age rather than of the card describing it, so it stays
          on screen whether the card is open or not. */}
      {entered && enteredBand && (
        <div className="world-age">
          <p>{enteredBand.label[locale]}</p>
          <button type="button" onClick={() => enterGate(null)}>{text.leave}</button>
        </div>
      )}
    </main>
  );
}

interface GateCardProps {
  gate: GateDefinition;
  hub?: Hub;
  summary: GateSummary;
  locale: Locale;
  onClose: () => void;
  onGoTo: (id: string) => void;
  onEnter: () => void;
}

/**
 * What a gate says before it is entered: where, when, and what kind of world.
 *
 * No picture of the world. The card is read while standing on the present-day
 * Earth, and a reconstruction shown there has already been crossed into before
 * anything was crossed — the gate stops being a threshold and becomes a
 * caption. What the world looked like is on the other side of the button, on
 * the Earth it belongs to.
 *
 * The counts are here because they are the honest size of the record; the cast
 * belongs inside the world, not on its front door.
 */
function GateCard({ gate, hub, summary, locale, onClose, onGoTo, onEnter }: GateCardProps) {
  const text = hubCopy[locale];
  const band = bandById(gate.band);
  // A hub's own ages are shown as a choice at the top rather than as a link at
  // the bottom: at this place, these are the worlds, and one of them is open.
  const ages = (hub?.gates ?? []).length > 1 ? hub!.gates : [];

  return (
    <aside className="gate-card" aria-label={gate.name[locale]}>
      <button type="button" className="gate-card__close" onClick={onClose} aria-label={text.close}>×</button>
      <p className="gate-card__age">{band?.label[locale] ?? `${summary.medianAgeMa} Ma`}</p>
      <h2>{gate.name[locale]}</h2>
      <p className="gate-card__place">{gate.place[locale]}</p>

      {ages.length > 0 && (
        <div className="gate-ages" role="group" aria-label={text.ages}>
          {ages.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={entry.id === gate.id}
              onClick={() => onGoTo(entry.id)}
            >
              {bandById(entry.band)?.label[locale].split(" · ")[1] ?? entry.name[locale]}
            </button>
          ))}
        </div>
      )}
      <p className="gate-card__world">{gate.world[locale]}</p>

      <p className="gate-card__counts">
        <b>{summary.sites}</b> {text.sites}
        <i aria-hidden="true">·</i>
        <b>{summary.occurrences.toLocaleString()}</b> {text.records}
        <i aria-hidden="true">·</i>
        <b>{summary.cast}</b> {text.named}
      </p>

      <button type="button" className="gate-card__enter" onClick={onEnter}>{text.enter}</button>

    </aside>
  );
}
