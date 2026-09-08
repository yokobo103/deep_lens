import { useEffect, useRef, type ReactNode } from "react";
import { hubCopy, type Locale } from "./copy";

interface HeaderMenuProps {
  open: boolean;
  locale: Locale;
  timescale: boolean;
  visits: number;
  /** True when the globe is all there is — nothing open, present day. */
  atGlobe: boolean;
  onToggle: () => void;
  onClose: () => void;
  onFindGate: () => void;
  onLog: () => void;
  onAchievements: () => void;
  onTimescale: () => void;
  onAbout: () => void;
}

/** Small, flat, one weight. Enough to tell four rows apart at a glance. */
const icon: Record<string, ReactNode> = {
  gate: <><circle cx="8" cy="8" r="6.2" /><circle cx="8" cy="8" r="1.8" /></>,
  log: <><rect x="2.6" y="2.6" width="10.8" height="10.8" rx="1" /><path d="M5.2 6h5.6M5.2 8.4h5.6M5.2 10.8h3.4" /></>,
  achievement: <><circle cx="8" cy="8" r="5.8" /><path d="M8 4.2v7.6M4.2 8h7.6" /><circle cx="8" cy="8" r="1.7" /></>,
  scale: <><path d="M3 12.4V8M6.3 12.4V4.6M9.6 12.4V6.8M12.9 12.4V3.4" /></>,
  about: <><circle cx="8" cy="8" r="6.2" /><path d="M8 7.2v4M8 4.9v.1" /></>,
};

function Glyph({ name }: { name: keyof typeof icon }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="1.1" strokeLinecap="round" aria-hidden="true">
      {icon[name]}
    </svg>
  );
}

/**
 * One way in to everything that is not the globe.
 *
 * The header had grown to five controls of three different kinds — a
 * destination, a switch and a language pair — all wearing the same small grey
 * chip, so none of them read as anything. Language stays out because switching
 * it is a thing you do once and want to see you can do; the rest drop from here.
 *
 * Chrome is rounded and content panels are square. That is not decoration: it
 * is how a reader tells the app's furniture from the app's contents without
 * being told.
 */
export function HeaderMenu({
  open, locale, timescale, visits, atGlobe,
  onToggle, onClose, onFindGate, onLog, onAchievements, onTimescale, onAbout,
}: HeaderMenuProps) {
  const text = hubCopy[locale];
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.querySelector("button")?.focus();
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`gate-menu__button${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-label={open ? text.close : text.menu}
        onClick={onToggle}
      >
        <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
      </button>

      {open && (
        <>
          <button type="button" className="gate-menu__scrim" aria-label={text.close} onClick={onClose} />
          <div ref={panelRef} className="gate-menu__panel" role="menu" aria-label={text.menu}>
            <button
              type="button" role="menuitem"
              className={`gate-menu__row${atGlobe ? " is-here" : ""}`}
              onClick={onFindGate}
            >
              <Glyph name="gate" />
              <span>{text.findGate}</span>
              <em aria-hidden="true">›</em>
            </button>

            <button type="button" role="menuitem" className="gate-menu__row" onClick={onLog}>
              <Glyph name="log" />
              <span>{text.logLong}</span>
              {visits > 0 && <b>{visits}</b>}
              <em aria-hidden="true">›</em>
            </button>

            <button type="button" role="menuitem" className="gate-menu__row" onClick={onAchievements}>
              <Glyph name="achievement" />
              <span>{text.achievement}</span>
              <em aria-hidden="true">›</em>
            </button>

            <button
              type="button" role="menuitemcheckbox" aria-checked={timescale}
              className="gate-menu__row" onClick={onTimescale}
            >
              <Glyph name="scale" />
              <span>{text.timescale}</span>
              <b className={timescale ? "is-on" : "is-off"}>{timescale ? text.on : text.off}</b>
            </button>

            <button type="button" role="menuitem" className="gate-menu__row" onClick={onAbout}>
              <Glyph name="about" />
              <span>{text.aboutTitle}</span>
              <em aria-hidden="true">›</em>
            </button>

            <p className="gate-menu__tag">{text.title}</p>
          </div>
        </>
      )}
    </>
  );
}
