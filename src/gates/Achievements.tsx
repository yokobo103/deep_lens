import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AchievementMark } from "./AchievementMark";
import { achievementDefinitions, type AchievementId } from "./AchievementCatalog";
import { hubCopy, type Locale } from "./copy";

interface AchievementsProps {
  earnedIds: ReadonlySet<AchievementId>;
  locale: Locale;
  onClose: () => void;
}

/** A quiet record of perspectives the journey happened to uncover. */
export function Achievements({ earnedIds, locale, onClose }: AchievementsProps) {
  const text = hubCopy[locale];
  const closeRef = useRef<HTMLButtonElement>(null);
  const found = achievementDefinitions.filter(({ id }) => earnedIds.has(id));
  const unknown = achievementDefinitions.filter(({ id }) => !earnedIds.has(id));

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="achievements" role="dialog" aria-modal="true" aria-label={text.achievementTitle}>
      <div className="achievements__sheet">
        <header className="achievements__head">
          <div>
            <p className="achievements__brand">DEEP LENS</p>
            <h2>{text.achievementTitle}</h2>
            <p>{text.achievementLede}</p>
          </div>
          <button ref={closeRef} type="button" className="achievements__close" onClick={onClose} aria-label={text.close}>×</button>
        </header>

        {found.length > 0 && (
          <section className="achievements__section">
            <h3>{text.achievementFoundSection}</h3>
            <ul className="achievements__list">
              {found.map((achievement) => (
                <li className="achievement-card is-found" key={achievement.id}>
                  <AchievementMark name={achievement.mark} />
                  <div>
                    <strong>{achievement.name[locale]}</strong>
                    <p>{achievement.description[locale]}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {unknown.length > 0 && (
          <section className="achievements__section is-unknown">
            <h3>{text.achievementUnknownSection}</h3>
            <ul className="achievements__list">
              {unknown.map((achievement) => (
                <li className="achievement-card is-hidden" key={achievement.id} aria-label={text.achievementUnknown}>
                  <AchievementMark name={achievement.mark} hidden />
                  <div>
                    <strong>？？？</strong>
                    <p>{text.achievementUnknown}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>,
    document.body,
  );
}
