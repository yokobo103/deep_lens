import { useEffect, useState } from "react";
import { GateGlobe } from "./GateGlobe";
import { gateById, gatesInBand, bandById, hubs, hubIdOf, type GateDefinition, type Hub } from "../data/gates";
import { loadGateManifest, loadGate, type GateDetail, type GateSummary } from "../data/gateData";
import { WorldPanel } from "./WorldPanel";
import { hubCopy, type Locale } from "./copy";

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
  const allHubs = hubs();

  const enterGate = (id: string | null) => {
    setEnteredId(id);
    setWorld(null);
    if (!id) return;
    loadGate(id)
      .then((detail) => setWorld((current) => (current?.id === detail.id ? current : detail)))
      .catch((error: unknown) => console.warn("World could not be loaded", error));
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
    loadGateManifest()
      .then(({ gates: baked }) => setGates(baked))
      .catch((error: unknown) => console.warn("Gates could not be loaded", error));
  }, []);

  const text = hubCopy[locale];
  const selected = selectedId ? gates.find((gate) => gate.id === selectedId) : undefined;
  const definition = selectedId ? gateById(selectedId) : undefined;
  const selectedHub = definition ? allHubs.find((hub) => hub.id === hubIdOf(definition)) : undefined;

  // A hub stands where its most recent gate stands. The places barely move
  // between a hub's ages — that is what makes them one hub — so the youngest
  // record is simply the best surveyed.
  const entered = enteredId ? gateById(enteredId) : undefined;
  const enteredBand = entered ? bandById(entered.band) : undefined;

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
    return summary ? [{ id: hub.id, lat: summary.lat, lng: summary.lng }] : [];
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
            return (
              <button
                key={point.id}
                data-globe-point={point.id}
                type="button"
                className={`gate-marker${isHere ? " is-here" : ""}`}
                onClick={() => enterGate(neighbour.id)}
                aria-label={neighbour.name[locale]}
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

      {!selected && !entered && (
        <p className="gate-hint">
          {text.hint}
          <small>{text.ways(hubPoints.length)}</small>
        </p>
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

      {entered && world && (
        <WorldPanel
          key={entered.id}
          gate={entered}
          detail={world}
          locale={locale}
          onLeave={() => enterGate(null)}
        />
      )}

      {entered && enteredBand && (
        <p className="world-age">{enteredBand.label[locale]}</p>
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
