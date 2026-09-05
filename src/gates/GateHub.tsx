import { useEffect, useState } from "react";
import { GateGlobe } from "./GateGlobe";
import { gateById, gatesInBand, bandById, hubs, hubIdOf, type GateDefinition, type Hub } from "../data/gates";
import { loadGateManifest, type GateSummary } from "../data/gateData";

export type Locale = "ja" | "en";

const copy = {
  ja: {
    title: "地球に眠る過去への入り口",
    globe: "地球儀。回すとゲートが見つかる",
    hint: "地球を回して、入り口を見つけよう",
    gates: (n: number) => `${n}の入り口`,
    ages: "この場所の時代",
    sites: "地点",
    records: "記録",
    named: "種",
    alsoHere: "同じ場所の別の時代",
    alsoThen: "同じ時代の別の世界",
    enter: "この世界に入る",
    close: "閉じる",
  },
  en: {
    title: "Ways into the Earth's past",
    globe: "Globe. Turn it to find gates",
    hint: "Turn the Earth and find a way in",
    gates: (n: number) => `${n} ways in`,
    ages: "Ages at this place",
    sites: "sites",
    records: "records",
    named: "named",
    alsoHere: "Another age, same place",
    alsoThen: "Another world, same age",
    enter: "Enter this world",
    close: "Close",
  },
} as const;

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
  const allHubs = hubs();

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem("deep-lens-locale", locale);
    } catch {
      // The language still works when storage is unavailable.
    }
  }, [locale]);

  useEffect(() => {
    loadGateManifest()
      .then(({ gates: baked }) => setGates(baked))
      .catch((error: unknown) => console.warn("Gates could not be loaded", error));
  }, []);

  const text = copy[locale];
  const selected = selectedId ? gates.find((gate) => gate.id === selectedId) : undefined;
  const definition = selectedId ? gateById(selectedId) : undefined;
  const selectedHub = definition ? allHubs.find((hub) => hub.id === hubIdOf(definition)) : undefined;

  // A hub stands where its most recent gate stands. The places barely move
  // between a hub's ages — that is what makes them one hub — so the youngest
  // record is simply the best surveyed.
  const hubPoints = allHubs.flatMap((hub) => {
    const youngest = [...hub.gates].sort((a, b) => a.ageMa.to - b.ageMa.to)[0];
    const summary = youngest ? gates.find((gate) => gate.id === youngest.id) : undefined;
    return summary ? [{ id: hub.id, lat: summary.lat, lng: summary.lng }] : [];
  });

  return (
    <main className="gate-hub">
      <GateGlobe
        ariaLabel={text.globe}
        points={hubPoints}
        renderPoint={(point) => {
          const hub = allHubs.find((entry) => entry.id === point.id);
          if (!hub) return null;
          const isSelected = selectedHub?.id === hub.id;
          return (
            <button
              key={point.id}
              data-globe-point={point.id}
              type="button"
              className={`gate-marker${isSelected ? " is-selected" : ""}${hub.gates.length > 1 ? " has-ages" : ""}`}
              onClick={() => setSelectedId(hub.gates[0]!.id)}
              aria-label={`${hub.name[locale]} — ${hub.place[locale]}`}
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
        <div>
          <p>DEEP LENS</p>
          <h1>{text.title}</h1>
        </div>
        <nav className="gate-language" aria-label="Language">
          <button type="button" aria-pressed={locale === "ja"} onClick={() => setLocale("ja")}>JA</button>
          <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
        </nav>
      </header>

      {!selected && (
        <p className="gate-hint">
          {text.hint}
          <small>{text.gates(hubPoints.length)}</small>
        </p>
      )}

      {selected && definition && (
        <GateCard
          gate={definition}
          hub={selectedHub}
          summary={selected}
          locale={locale}
          onClose={() => setSelectedId(null)}
          onGoTo={setSelectedId}
        />
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
}

/**
 * What a gate says before it is entered: where, when, and what kind of world.
 * The counts are here because they are the honest size of the record; the cast
 * belongs inside the world, not on its front door.
 */
function GateCard({ gate, hub, summary, locale, onClose, onGoTo }: GateCardProps) {
  const text = copy[locale];
  const band = bandById(gate.band);
  const alsoThen = gatesInBand(gate.band, gate.id);
  // A hub's own ages are shown as a choice at the top rather than as a link at
  // the bottom: at this place, these are the worlds, and one of them is open.
  const ages = (hub?.gates ?? []).length > 1 ? hub!.gates : [];
  const alsoHere = ages.length > 0
    ? []
    : (gate.alsoAtThisPlace ?? []).map(gateById).filter((entry): entry is GateDefinition => Boolean(entry));

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

      <button type="button" className="gate-card__enter">{text.enter}</button>

      {alsoHere.length > 0 && (
        <GateLinks title={text.alsoHere} gates={alsoHere} locale={locale} onGoTo={onGoTo} />
      )}
      {alsoThen.length > 0 && (
        <GateLinks title={text.alsoThen} gates={alsoThen} locale={locale} onGoTo={onGoTo} />
      )}
    </aside>
  );
}

function GateLinks({ title, gates, locale, onGoTo }: { title: string; gates: GateDefinition[]; locale: Locale; onGoTo: (id: string) => void }) {
  return (
    <div className="gate-links">
      <span>{title}</span>
      {gates.map((gate) => (
        <button key={gate.id} type="button" onClick={() => onGoTo(gate.id)}>
          {gate.name[locale]}
        </button>
      ))}
    </div>
  );
}
