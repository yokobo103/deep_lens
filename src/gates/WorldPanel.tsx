import { useEffect, useState } from "react";
import { bandById, type GateDefinition } from "../data/gates";
import type { GateDetail } from "../data/gateData";
import { agePlate, eraOf } from "../data/eras";
import { dominantEnvironment, ENV_COLOR, ENV_LABEL } from "../data/environment";
import { sceneSource } from "./scenes";
import { AgePicker } from "./AgePicker";
import { WorldDetail } from "./WorldDetail";
import type { Locale } from "./copy";
import { hubCopy } from "./copy";

interface WorldPanelProps {
  gate: GateDefinition;
  detail: GateDetail;
  locale: Locale;
  /** The other ages of this same place. Empty when the place has only one. */
  alsoHere: readonly GateDefinition[];
  /**
   * Whether to whisper that this Earth has other doors on it.
   *
   * Every band holds at least two gates, so the sentence is always true and
   * would become wallpaper if it always showed. It is shown only until the
   * reader has stood in two worlds of one age — after that they have found the
   * move themselves and do not need telling. It names no number and no
   * direction on purpose: finding them is the reader's, not ours.
   */
  hintBand: boolean;
  onGoTo: (gateId: string) => void;
  /** Puts the panel away. Does not leave the world — that is the age banner's. */
  onDismiss: () => void;
}

/**
 * The front of a world: what it was called, when, what kind of place, and two
 * ways further in.
 *
 * Deliberately short. This card sits over the globe, and the globe is the thing
 * it is describing — everything that wants room of its own is behind a press.
 * The second press is only offered where there is somewhere to go: ten of the
 * fifteen gates are the only age their place has, and a button that opens an
 * empty list is worse than no button.
 */
export function WorldPanel({ gate, detail, locale, alsoHere, hintBand, onGoTo, onDismiss }: WorldPanelProps) {
  const text = hubCopy[locale];
  const [picking, setPicking] = useState(false);
  const [looking, setLooking] = useState(false);
  const compact = useCompactLayout();
  const kind = dominantEnvironment(detail.environments);
  const band = bandById(gate.band);
  const ma = band?.terrainMa ?? detail.medianAgeMa ?? 0;
  const scene = sceneSource(gate.id);

  return (
    <div className={`world-panel-shell${compact ? " is-compact" : ""}`}>
      <button type="button" className="world-panel__dismiss" onClick={onDismiss} aria-label={text.close} title={text.close}>×</button>
      <aside className="world-panel" aria-label={gate.name[locale]}>
        <header className="world-panel__bar">
          <b>{agePlate(ma)}</b>
          <span>{eraOf(ma)[locale]} · {band?.label[locale].split(" · ")[0]}</span>
        </header>

        {scene && (
          <button type="button" className="world-panel__scene" onClick={() => setLooking(true)} aria-label={text.peek}>
            <img src={scene} alt="" />
            <span>{text.sceneTag}</span>
          </button>
        )}

        <h2>{gate.name[locale]}</h2>
        <p className="world-panel__world">{gate.world[locale]}</p>

        <p className="world-panel__kind">
          <span className="world-panel__swatch" style={{ background: ENV_COLOR[kind] }} aria-hidden="true" />
          {ENV_LABEL[kind][locale]}
        </p>

        <div className="world-panel__ways">
          {alsoHere.length > 0 && (
            <button type="button" className="world-panel__ages" onClick={() => setPicking(true)}>
              {text.otherAges}<i aria-hidden="true">›</i>
            </button>
          )}
          <button type="button" className="world-panel__peek" onClick={() => setLooking(true)}>
            {text.peek}<i aria-hidden="true">›</i>
          </button>
        </div>

        {hintBand && <small className="world-panel__maybe">{text.maybeMore}</small>}

        <small className="world-panel__note">{text.residentsNote}</small>

        {picking && (
          <AgePicker
            here={gate}
            alsoHere={alsoHere}
            locale={locale}
            onGoTo={(id) => { setPicking(false); onGoTo(id); }}
            onClose={() => setPicking(false)}
          />
        )}

        {looking && (
          <WorldDetail gate={gate} detail={detail} locale={locale} onClose={() => setLooking(false)} />
        )}
      </aside>
    </div>
  );
}

/** True on screens where a panel and the globe cannot both have the room. */
function useCompactLayout(): boolean {
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 720px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const update = () => setCompact(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return compact;
}
