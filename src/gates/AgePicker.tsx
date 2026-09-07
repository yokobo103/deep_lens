import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { bandById, type GateDefinition } from "../data/gates";
import { agePlate, eraOf } from "../data/eras";
import { sceneSource } from "./scenes";
import { hubCopy, type Locale } from "./copy";

interface AgePickerProps {
  /** The age being stood in, and the others open at this same place. */
  here: GateDefinition;
  alsoHere: readonly GateDefinition[];
  locale: Locale;
  onGoTo: (gateId: string) => void;
  onClose: () => void;
}

/**
 * Which age of this place to step into.
 *
 * Offered as a choice rather than a jump, because the choice is the thing: a
 * list of ages all standing on the same ground is the app's whole claim in one
 * view. Only ages of *this place* appear. Somewhere else at some other time is
 * a different app.
 */
export function AgePicker({ here, alsoHere, locale, onGoTo, onClose }: AgePickerProps) {
  const text = hubCopy[locale];
  const options = [here, ...alsoHere].sort((a, b) => (bandById(b.band)?.terrainMa ?? 0) - (bandById(a.band)?.terrainMa ?? 0));
  const [chosen, setChosen] = useState(here.id);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="picker" role="dialog" aria-modal="true" aria-label={text.pickAge}>
      <button type="button" className="picker__scrim" aria-label={text.close} onClick={onClose} />
      <div className="picker__sheet">
        <button type="button" className="picker__close" onClick={onClose} aria-label={text.close}>×</button>
        <h2>{text.pickAge}</h2>
        <p className="picker__lede">{text.pickAgeLede}</p>

        <div className="picker__options" role="radiogroup" aria-label={text.pickAge}>
          {options.map((gate) => {
            const band = bandById(gate.band);
            const ma = band?.terrainMa ?? 0;
            const scene = sceneSource(gate.id);
            return (
              <button
                key={gate.id}
                type="button"
                role="radio"
                aria-checked={chosen === gate.id}
                className={`picker__option${chosen === gate.id ? " is-chosen" : ""}`}
                onClick={() => setChosen(gate.id)}
              >
                <span className="picker__dot" aria-hidden="true" />
                {scene && <img src={scene} alt="" />}
                <span className="picker__what">
                  <b>{agePlate(ma)}</b>
                  <i>{band?.label[locale].split(" · ")[0] ?? gate.name[locale]}</i>
                  <em>{gate.world[locale]}</em>
                </span>
              </button>
            );
          })}
        </div>

        <div className="picker__actions">
          <button type="button" className="picker__cancel" onClick={onClose}>{text.cancel}</button>
          <button
            type="button"
            className="picker__go"
            disabled={chosen === here.id}
            onClick={() => onGoTo(chosen)}
          >
            {text.goToAge}
          </button>
        </div>
        <p className="picker__era" aria-hidden="true">{eraOf(bandById(here.band)?.terrainMa ?? 0)[locale]}</p>
      </div>
    </div>,
    document.body,
  );
}
