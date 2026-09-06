import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { sceneSource } from "./scenes";
import { hubCopy, type Locale } from "./copy";

interface GateSceneProps {
  gateId: string;
  /** The world's name, for anyone who cannot see the picture. */
  title: string;
  locale: Locale;
}

/**
 * What a world looked like, as far as anyone can say.
 *
 * Shown small, where the world is named. Small is not a compromise: at panel
 * width the species names drawn into the artwork are a few pixels tall and
 * cannot be read, so the picture there is the feel of the place and nothing
 * more. Opening it is how the names become legible, and that is also the only
 * place the app has to say what kind of claim a reconstruction is — so the
 * note lives with the enlargement rather than repeating under every thumbnail.
 *
 * On a phone the enlargement is drawn taller than the screen is wide and
 * scrolls sideways. Fitting a wide frame into a portrait screen would leave it
 * the same unreadable size it already was in the panel, which would make
 * opening it pointless; panning across it is how a phone reads a wide picture.
 *
 * The enlargement is portalled to the body. The panel it is opened from has a
 * `backdrop-filter`, which makes it the containing block for anything fixed
 * inside it; a full-screen view rendered in place would be trapped in a 340px
 * box.
 */
export function GateScene({ gateId, title, locale }: GateSceneProps) {
  const source = sceneSource(gateId);
  const [open, setOpen] = useState(false);
  const text = hubCopy[locale];

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!source) return null;

  return (
    <>
      <button
        type="button"
        className="gate-scene"
        onClick={() => setOpen(true)}
        aria-label={`${title} — ${text.sceneOpen}`}
      >
        <img src={source} alt="" />
        <span className="gate-scene__tag">{text.sceneTag}</span>
      </button>

      {open && createPortal(
        <div className="scene-view" role="dialog" aria-modal="true" aria-label={title}>
          <button type="button" className="scene-view__backdrop" onClick={() => setOpen(false)} aria-label={text.close} />
          <figure>
            <div className="scene-view__frame">
              <img src={source} alt={title} />
            </div>
            <figcaption>{text.sceneNote}</figcaption>
          </figure>
          <button type="button" className="scene-view__close" onClick={() => setOpen(false)}>{text.close}</button>
        </div>,
        document.body,
      )}
    </>
  );
}
