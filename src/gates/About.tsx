import { useEffect } from "react";
import { createPortal } from "react-dom";
import poster from "../assets/about/poster.webp";
import { hubCopy, type Locale } from "./copy";

interface AboutProps {
  locale: Locale;
  onClose: () => void;
}

/**
 * Why this exists, in the maker's own words.
 *
 * Kept out of the globe entirely. A note about where an app came from is read
 * once, and anything read once should not be occupying a corner of the screen
 * for everyone who has already read it.
 */
export function About({ locale, onClose }: AboutProps) {
  const text = hubCopy[locale];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="about" role="dialog" aria-modal="true" aria-label={text.aboutTitle}>
      <div className="about__sheet">
        <button type="button" className="about__close" onClick={onClose} aria-label={text.close}>×</button>

        <img className="about__poster" src={poster} alt="" />

        <div className="about__words">
          <p className="about__brand">DEEP LENS</p>
          <h2>{text.aboutTitle}</h2>
          {text.aboutBody.map((line) => <p key={line}>{line}</p>)}
          <p className="about__sign">{text.aboutSign}</p>

          <dl className="about__sources">
            {text.aboutSources.map(([what, who]) => (
              <div key={what}>
                <dt>{what}</dt>
                <dd>{who}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>,
    document.body,
  );
}
