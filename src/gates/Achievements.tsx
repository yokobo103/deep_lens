import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AchievementMark } from "./AchievementMark";
import { achievementDefinitions, type AchievementGroup, type AchievementId } from "./AchievementCatalog";
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
  /**
   * Shelved by the kind of travelling each one asks for, rather than piled into
   * "found" and "not found". Thirty-two question marks in a column say nothing;
   * six shelves with a count on each say what sort of journeys exist and which
   * sort this one has not tried.
   */
  const shelves = [...new Map(achievementDefinitions.map((a) => [a.group, a.group])).keys()]
    .map((group: AchievementGroup) => {
      const items = achievementDefinitions.filter((a) => a.group === group);
      return { group, items, found: items.filter(({ id }) => earnedIds.has(id)).length };
    });

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

        {shelves.map(({ group, items, found }) => (
          <section className="achievements__section" key={group}>
            <h3>
              {text.achievementGroups[group]}
              <b>{text.achievementProgress(found, items.length)}</b>
            </h3>
            <ul className="achievements__list">
              {items.map((achievement) => {
                const earned = earnedIds.has(achievement.id);
                return (
                  <li
                    className={`achievement-card ${earned ? "is-found" : "is-hidden"}`}
                    key={achievement.id}
                    aria-label={earned ? undefined : text.achievementUnknown}
                  >
                    <AchievementMark name={achievement.mark} hidden={!earned} />
                    <div>
                      <strong>{earned ? achievement.name[locale] : "？？？"}</strong>
                      <p>{earned ? achievement.description[locale] : text.achievementUnknown}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

      </div>
    </div>,
    document.body,
  );
}
