import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AchievementMark } from "./AchievementMark";
import { achievementDefinitions, type AchievementGroup, type AchievementId } from "./AchievementCatalog";
import { hubCopy, type Locale } from "./copy";

interface AchievementsProps {
  earnedIds: ReadonlySet<AchievementId>;
  locale: Locale;
  /** Opened by pressing a toast: scroll to that discovery and mark it briefly. */
  focusId?: AchievementId | null;
  onClose: () => void;
}

/** A quiet record of perspectives the journey happened to uncover. */
export function Achievements({ earnedIds, locale, focusId, onClose }: AchievementsProps) {
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

  // Arriving from a toast, the card that was announced is somewhere down a list
  // of forty-one. Bringing it into view is the whole point of the press.
  useEffect(() => {
    if (!focusId) return;
    const card = document.getElementById(`achievement-${focusId}`);
    card?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusId]);

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
                // "Not found yet" is wrong on a shelf of animals; that shelf
                // says "not met yet". Any shelf may name its own.
                const unknown = text.achievementUnknownGroups[group] ?? text.achievementUnknown;
                return (
                  <li
                    id={`achievement-${achievement.id}`}
                    className={`achievement-card ${earned ? "is-found" : "is-hidden"}`
                      + (achievement.id === focusId ? " is-called" : "")}
                    key={achievement.id}
                    aria-label={earned ? undefined : unknown}
                  >
                    <AchievementMark name={achievement.mark} hidden={!earned} />
                    <div>
                      <strong>{earned ? achievement.name[locale] : "？？？"}</strong>
                      <p>{earned ? achievement.description[locale] : unknown}</p>
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
