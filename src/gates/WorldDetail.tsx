import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { bandById, type GateDefinition } from "../data/gates";
import type { GateDetail } from "../data/gateData";
import { agePlate, eraOf } from "../data/eras";
import { dominantEnvironment, ENV_COLOR, ENV_LABEL } from "../data/environment";
import { layerOf, LAYER_LABEL, LAYER_ORDER, type Layer } from "../data/habitat";
import { japaneseName } from "../data/names";
import { drawnIn } from "../data/drawn";
import { sceneHighlight } from "../data/sceneHighlights";
import { sceneSource } from "./scenes";
import { hubCopy, type Locale } from "./copy";

interface WorldDetailProps {
  gate: GateDefinition;
  detail: GateDetail;
  locale: Locale;
  onClose: () => void;
}

/**
 * Inside a world, at the size a world deserves.
 *
 * Three depths, and the order is the point. The picture is what the place
 * looked like. Under it, the five creatures actually painted into that picture
 * — so a reader can go from a shape they just looked at to a name, which a
 * list of fourteen most-recorded species can never do. Under that, on request,
 * everyone else: banded by where they lived, and then the whole record.
 */
export function WorldDetail({ gate, detail, locale, onClose }: WorldDetailProps) {
  const text = hubCopy[locale];
  const [listOpen, setListOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [highlighted, setHighlighted] = useState<{ name: string; token: number } | null>(null);
  const scene = sceneSource(gate.id);
  const band = bandById(gate.band);
  const ma = band?.terrainMa ?? detail.medianAgeMa ?? 0;
  const kind = dominantEnvironment(detail.environments);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (zoomed) setZoomed(false); else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, zoomed]);

  useEffect(() => {
    if (!highlighted) return;
    const timer = window.setTimeout(() => setHighlighted(null), 3200);
    return () => window.clearTimeout(timer);
  }, [highlighted]);

  const drawn = drawnIn(gate.id);
  const highlightedPosition = highlighted ? sceneHighlight(gate.id, highlighted.name) : undefined;
  const byName = new Map(detail.cast.map((member) => [member.name, member]));

  const byLayer = new Map<Layer, typeof detail.cast>();
  for (const member of detail.cast) {
    const layer = layerOf(member.phylum ?? null, member.env ?? null, member.habit ?? null, member.group, member.form ?? null);
    byLayer.set(layer, [...(byLayer.get(layer) ?? []), member]);
  }
  const layers = LAYER_ORDER.flatMap((layer) => {
    const members = byLayer.get(layer);
    return members?.length ? [[layer, members] as const] : [];
  });

  return createPortal(
    <div className="detail" role="dialog" aria-modal="true" aria-label={gate.name[locale]}>
      <div className="detail__sheet">
        <header className="detail__bar">
          <b>{agePlate(ma)}</b>
          <span>{eraOf(ma)[locale]} · {band?.label[locale].split(" · ")[0]}</span>
          <button type="button" onClick={onClose} aria-label={text.close}>×</button>
        </header>

        {scene && (
          <div className="detail__scene">
            <img src={scene} alt={gate.name[locale]} />
            {highlighted && highlightedPosition && (
              <span
                key={highlighted.token}
                className="detail__scene-highlight"
                style={{ left: `${highlightedPosition.x * 100}%`, top: `${highlightedPosition.y * 100}%` }}
                aria-hidden="true"
              />
            )}
            <button type="button" className="detail__zoom" onClick={() => setZoomed(true)} aria-label={text.zoom}>
              <svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
                <circle cx="7.6" cy="7.6" r="5.1" /><path d="M11.4 11.4 16 16M7.6 5.4v4.4M5.4 7.6h4.4" />
              </svg>
            </button>
            <span className="detail__tag">{text.sceneTag}</span>
          </div>
        )}

        <div className="detail__body">
          <h2>{gate.name[locale]}</h2>
          <p className="detail__world">{gate.world[locale]}</p>
          <p className="detail__kind">
            <span style={{ background: ENV_COLOR[kind] }} aria-hidden="true" />
            {ENV_LABEL[kind][locale]}
          </p>

          <h3 className="detail__heading">
            {text.encountered}
            <small>{text.encounteredNote}</small>
          </h3>
          <ul className="detail__drawn">
            {drawn.map((name) => {
              const ja = locale === "ja" ? japaneseName(name) : undefined;
              const member = byName.get(name);
              const canLocate = Boolean(sceneHighlight(gate.id, name));
              const isHighlighted = highlighted?.name === name;
              const contents = (
                <>
                  {ja && <b>{ja}</b>}
                  <em>{name}</em>
                  {member && <i>{member.count}</i>}
                </>
              );
              return (
                <li key={name} className={`${canLocate ? "is-locatable" : ""}${isHighlighted ? " is-highlighted" : ""}`}>
                  {canLocate ? (
                    <button
                      type="button"
                      className="detail__drawn-locate"
                      aria-pressed={isHighlighted}
                      aria-label={`${name} — ${text.findInScene}`}
                      onClick={() => setHighlighted({ name, token: Date.now() })}
                    >
                      {contents}
                    </button>
                  ) : contents}
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            className="detail__more"
            aria-expanded={listOpen}
            onClick={() => setListOpen((open) => !open)}
          >
            {text.residentList}
            <span aria-hidden="true">{listOpen ? "−" : "›"}</span>
          </button>

          {listOpen && (
            <div className="detail__residents">
              {layers.map(([layer, members]) => (
                <div key={layer} className="detail__layer">
                  <span>{LAYER_LABEL[layer][locale]}</span>
                  <ul>
                    {members.map((member) => {
                      const ja = locale === "ja" ? japaneseName(member.name) : undefined;
                      return (
                        <li key={member.name}>
                          <b>{ja ?? member.name}</b>
                          {ja && <em>{member.name}</em>}
                          <i>{member.count}</i>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              <small>{text.residentsNote}</small>
            </div>
          )}

          <p className="detail__rest">{text.moreRecorded(detail.castTotal)}</p>
        </div>
      </div>

      {zoomed && scene && (
        <div className="detail__full" role="dialog" aria-modal="true" aria-label={gate.name[locale]}>
          <button type="button" className="detail__fullScrim" aria-label={text.close} onClick={() => setZoomed(false)} />
          <figure>
            <div className="detail__frame"><img src={scene} alt={gate.name[locale]} /></div>
            <figcaption>{text.sceneNote}</figcaption>
          </figure>
          <button type="button" className="detail__fullClose" onClick={() => setZoomed(false)}>{text.close}</button>
        </div>
      )}
    </div>,
    document.body,
  );
}
